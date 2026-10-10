import { NestingPieceInput, NestingResult } from './types';

export const NESTING_LEARNING_STORAGE_KEY = 'hmb_nesting_learning_v1';
const MAX_STORAGE_BYTES = 3800; // < 4 KB límite estricto de persistencia ligera
const MAX_PROFILES_COUNT = 24;

export interface NestingProfileContext {
  printableWidthMm: number;
  spacingMm: number;
  hasSleeves: boolean;
  aspectRatioBucket?: string | number;
}

export interface OptimizationRunRecordInput {
  profileKey?: string;
  printableWidthMm?: number;
  spacingMm?: number;
  hasSleeves?: boolean;
  aspectRatioBucket?: string | number;
  strategyName: string;
  utilizationPercent: number;
  savedLengthMm?: number;
  bottomFilledCount?: number;
}

export interface NestingProfileMemory {
  profileKey: string;
  bestStrategyName: string;
  bestUtilizationPercent: number;
  bestSavedLengthMm: number;
  avgSavedLengthMm: number;
  totalSavedLengthMm: number;
  bottomFilledCount: number;
  runsCount: number;
  lastUpdatedAt: number;
}

export interface NestingLearningStore {
  version: 1;
  totalRuns: number;
  totalSavedLengthMm: number;
  profiles: Record<string, NestingProfileMemory>;
}

export interface NestingLearningStats {
  learnedOptimizationsCount: number;
  learnedProfilesCount: number;
  totalRuns: number;
  averageSavedLengthMm: number;
  averageSavedCm: number;
  totalSavedLengthMm: number;
  bestUtilizationPercent: number;
  topStrategyName: string;
}

let inMemoryFallbackStore: NestingLearningStore = createEmptyStore();

function createEmptyStore(): NestingLearningStore {
  return {
    version: 1,
    totalRuns: 0,
    totalSavedLengthMm: 0,
    profiles: {},
  };
}

/**
 * Clasifica la relación de aspecto promedio (alto/ancho) en un bucket discreto.
 */
export function normalizeAspectRatioBucket(aspectRatioOrBucket?: string | number): string {
  if (typeof aspectRatioOrBucket === 'string' && aspectRatioOrBucket.trim().length > 0) {
    return aspectRatioOrBucket.trim().toUpperCase().replace(/\s+/g, '_');
  }
  if (typeof aspectRatioOrBucket === 'number' && Number.isFinite(aspectRatioOrBucket)) {
    if (aspectRatioOrBucket < 0.85) return 'WIDE';
    if (aspectRatioOrBucket <= 1.25) return 'BALANCED';
    return 'ELONGATED';
  }
  return 'BALANCED';
}

/**
 * Calcula el bucket de relación de aspecto a partir de una colección de piezas de entrada.
 */
export function computeAspectRatioBucketFromPieces(
  pieces: ReadonlyArray<Pick<NestingPieceInput, 'bbox'>>
): string {
  if (!pieces || pieces.length === 0) return 'BALANCED';
  let sumRatio = 0;
  let validCount = 0;
  for (const p of pieces) {
    const w = p.bbox?.width ?? 0;
    const h = p.bbox?.height ?? 0;
    if (w > 0 && h > 0) {
      sumRatio += h / w;
      validCount++;
    }
  }
  if (validCount === 0) return 'BALANCED';
  return normalizeAspectRatioBucket(sumRatio / validCount);
}

/**
 * Genera una huella de contexto (`profileKey`) determinista basada en:
 * `(printableWidthMm, spacingMm, hasSleeves, aspectRatioBucket)`.
 */
export function buildProfileKey(
  contextOrWidth: NestingProfileContext | number,
  spacingMm?: number,
  hasSleeves?: boolean,
  aspectRatioBucket?: string | number
): string {
  if (typeof contextOrWidth === 'object' && contextOrWidth !== null) {
    const w = Math.round(Number(contextOrWidth.printableWidthMm) || 1120);
    const s = Math.round((Number(contextOrWidth.spacingMm) || 0) * 10) / 10;
    const sleevesTag = contextOrWidth.hasSleeves ? 'SLEEVES' : 'NOSLEEVES';
    const bucket = normalizeAspectRatioBucket(contextOrWidth.aspectRatioBucket);
    return `W${w}_S${s}_${sleevesTag}_${bucket}`;
  }

  const w = Math.round(Number(contextOrWidth) || 1120);
  const s = Math.round((Number(spacingMm) || 0) * 10) / 10;
  const sleevesTag = Boolean(hasSleeves) ? 'SLEEVES' : 'NOSLEEVES';
  const bucket = normalizeAspectRatioBucket(aspectRatioBucket);
  return `W${w}_S${s}_${sleevesTag}_${bucket}`;
}

function loadStore(): NestingLearningStore {
  try {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis && globalThis.localStorage) {
      const raw = globalThis.localStorage.getItem(NESTING_LEARNING_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<NestingLearningStore>;
        if (parsed && parsed.version === 1 && parsed.profiles && typeof parsed.profiles === 'object') {
          inMemoryFallbackStore = {
            version: 1,
            totalRuns: Number(parsed.totalRuns) || 0,
            totalSavedLengthMm: Number(parsed.totalSavedLengthMm) || 0,
            profiles: { ...parsed.profiles },
          };
          return inMemoryFallbackStore;
        }
      }
    }
  } catch {
    // Entorno Node / Vitest sin localStorage o acceso restringido: usar memoria en proceso
  }
  return inMemoryFallbackStore;
}

function pruneStoreToFitBudget(store: NestingLearningStore): NestingLearningStore {
  const entries = Object.entries(store.profiles);
  if (entries.length > MAX_PROFILES_COUNT) {
    entries.sort((a, b) => (b[1].lastUpdatedAt || 0) - (a[1].lastUpdatedAt || 0));
    const trimmedProfiles: Record<string, NestingProfileMemory> = {};
    for (const [k, v] of entries.slice(0, MAX_PROFILES_COUNT)) {
      trimmedProfiles[k] = v;
    }
    store.profiles = trimmedProfiles;
  }

  let serialized = JSON.stringify(store);
  while (serialized.length > MAX_STORAGE_BYTES && Object.keys(store.profiles).length > 1) {
    const currentEntries = Object.entries(store.profiles);
    currentEntries.sort((a, b) => (a[1].lastUpdatedAt || 0) - (b[1].lastUpdatedAt || 0));
    const oldestKey = currentEntries[0][0];
    delete store.profiles[oldestKey];
    serialized = JSON.stringify(store);
  }

  return store;
}

function saveStore(store: NestingLearningStore): void {
  const pruned = pruneStoreToFitBudget(store);
  inMemoryFallbackStore = pruned;
  try {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis && globalThis.localStorage) {
      globalThis.localStorage.setItem(NESTING_LEARNING_STORAGE_KEY, JSON.stringify(pruned));
    }
  } catch {
    // Ignorar silenciosamente en entornos sin localStorage o cuota llena
  }
}

/**
 * Registra el resultado de una ejecución de optimización de nesting y actualiza
 * qué variante logró el mejor `utilizationPercent` y cuántos milímetros ahorró (`savedLengthMm`).
 */
export function recordOptimizationRun(
  inputOrProfileKey: OptimizationRunRecordInput | NestingResult | string,
  strategyNameOrContext?: string | Partial<NestingProfileContext>,
  utilizationPercentArg?: number,
  savedLengthMmArg?: number,
  bottomFilledCountArg?: number
): NestingProfileMemory {
  const store = loadStore();

  let profileKey: string;
  let strategyName: string;
  let utilizationPercent: number;
  let savedLengthMm: number;
  let bottomFilledCount: number;

  if (typeof inputOrProfileKey === 'string') {
    profileKey = inputOrProfileKey;
    strategyName = typeof strategyNameOrContext === 'string' ? strategyNameOrContext : 'FLUJO_MODULAR_CONTINUO';
    utilizationPercent = Number(utilizationPercentArg) || 0;
    savedLengthMm = Math.max(0, Number(savedLengthMmArg) || 0);
    bottomFilledCount = Math.max(0, Number(bottomFilledCountArg) || 0);
  } else if ('placedPieces' in inputOrProfileKey && 'totalRollLengthMm' in inputOrProfileKey) {
    const result = inputOrProfileKey;
    const ctx = (typeof strategyNameOrContext === 'object' && strategyNameOrContext !== null)
      ? strategyNameOrContext
      : {};
    const hasSleeves =
      ctx.hasSleeves ??
      result.placedPieces.some((p) => p.pieceType?.toUpperCase().startsWith('MANGA'));
    const aspectBucket =
      ctx.aspectRatioBucket ?? computeAspectRatioBucketFromPieces(result.placedPieces);
    profileKey = buildProfileKey({
      printableWidthMm: ctx.printableWidthMm ?? result.printableWidthMm,
      spacingMm: ctx.spacingMm ?? 3,
      hasSleeves,
      aspectRatioBucket: aspectBucket,
    });
    strategyName = result.strategyName || 'FLUJO_MODULAR_CONTINUO';
    utilizationPercent = Number(result.utilizationPercent) || 0;
    savedLengthMm = Math.max(0, Number(result.savedLengthMm) || 0);
    bottomFilledCount = Math.max(0, Number(result.bottomFilledCount) || 0);
  } else {
    const input = inputOrProfileKey;
    profileKey =
      input.profileKey ||
      buildProfileKey({
        printableWidthMm: input.printableWidthMm ?? 1120,
        spacingMm: input.spacingMm ?? 3,
        hasSleeves: input.hasSleeves ?? true,
        aspectRatioBucket: input.aspectRatioBucket ?? 'BALANCED',
      });
    strategyName = input.strategyName || 'FLUJO_MODULAR_CONTINUO';
    utilizationPercent = Number(input.utilizationPercent) || 0;
    savedLengthMm = Math.max(0, Number(input.savedLengthMm) || 0);
    bottomFilledCount = Math.max(0, Number(input.bottomFilledCount) || 0);
  }

  const cleanUtil = Math.round(Math.max(0, Math.min(100, utilizationPercent)) * 100) / 100;
  const cleanSavedMm = Math.round(savedLengthMm * 10) / 10;

  const existing = store.profiles[profileKey];
  const now = Date.now();

  let updated: NestingProfileMemory;
  if (!existing) {
    updated = {
      profileKey,
      bestStrategyName: strategyName,
      bestUtilizationPercent: cleanUtil,
      bestSavedLengthMm: cleanSavedMm,
      avgSavedLengthMm: cleanSavedMm,
      totalSavedLengthMm: cleanSavedMm,
      bottomFilledCount,
      runsCount: 1,
      lastUpdatedAt: now,
    };
  } else {
    const newRunsCount = existing.runsCount + 1;
    const newTotalSaved = Math.round((existing.totalSavedLengthMm + cleanSavedMm) * 10) / 10;
    const newAvgSaved = Math.round((newTotalSaved / newRunsCount) * 10) / 10;
    const isBetter =
      cleanUtil > existing.bestUtilizationPercent ||
      (cleanUtil === existing.bestUtilizationPercent && cleanSavedMm >= existing.bestSavedLengthMm);

    updated = {
      profileKey,
      bestStrategyName: isBetter ? strategyName : existing.bestStrategyName,
      bestUtilizationPercent: isBetter ? cleanUtil : existing.bestUtilizationPercent,
      bestSavedLengthMm: Math.max(existing.bestSavedLengthMm, cleanSavedMm),
      avgSavedLengthMm: newAvgSaved,
      totalSavedLengthMm: newTotalSaved,
      bottomFilledCount: isBetter ? bottomFilledCount : existing.bottomFilledCount,
      runsCount: newRunsCount,
      lastUpdatedAt: now,
    };
  }

  store.profiles[profileKey] = updated;
  store.totalRuns = (store.totalRuns || 0) + 1;
  store.totalSavedLengthMm = Math.round(((store.totalSavedLengthMm || 0) + cleanSavedMm) * 10) / 10;

  saveStore(store);
  return updated;
}

/**
 * Obtiene la memoria aprendida para un perfil específico si existe.
 */
export function getLearnedProfile(profileKey: string): NestingProfileMemory | null {
  const store = loadStore();
  return store.profiles[profileKey] ?? null;
}

/**
 * Devuelve un resumen claro en español para mostrar en la interfaz de usuario.
 * Ejemplo: "Acomodo Inteligente activo · Aprovechamiento 82.4% · Sin huecos inferiores"
 */
export function getSmartRecommendationSummary(result: NestingResult): string {
  const utilFormatted = Number((result.utilizationPercent || 0).toFixed(1));
  const bottomFilled = result.bottomFilledCount ?? 0;
  const savedMm = result.savedLengthMm ?? 0;

  const details: string[] = [
    'Acomodo Inteligente activo',
    `Aprovechamiento ${utilFormatted}%`,
    'Sin huecos inferiores',
  ];

  if (bottomFilled > 0) {
    details.push(`${bottomFilled} ${bottomFilled === 1 ? 'pieza reubicada' : 'piezas reubicadas'} en base`);
  }

  if (savedMm > 0) {
    const savedCm = Number((savedMm / 10).toFixed(1));
    details.push(`Ahorro ${savedCm} cm`);
  }

  return details.join(' · ');
}

/**
 * Expone estadísticas globales del motor de auto-aprendizaje:
 * número de optimizaciones aprendidas y promedio de tela ahorrada.
 */
export function getLearningStats(): NestingLearningStats {
  const store = loadStore();
  const profileList = Object.values(store.profiles);
  const learnedProfilesCount = profileList.length;
  const totalRuns = store.totalRuns || profileList.reduce((acc, p) => acc + p.runsCount, 0);
  const totalSavedLengthMm =
    store.totalSavedLengthMm || profileList.reduce((acc, p) => acc + p.totalSavedLengthMm, 0);

  const averageSavedLengthMm =
    totalRuns > 0 ? Math.round((totalSavedLengthMm / totalRuns) * 10) / 10 : 0;
  const averageSavedCm = Math.round((averageSavedLengthMm / 10) * 10) / 10;

  let bestUtilizationPercent = 0;
  const strategyCounts = new Map<string, number>();

  for (const profile of profileList) {
    if (profile.bestUtilizationPercent > bestUtilizationPercent) {
      bestUtilizationPercent = profile.bestUtilizationPercent;
    }
    const count = strategyCounts.get(profile.bestStrategyName) || 0;
    strategyCounts.set(profile.bestStrategyName, count + profile.runsCount);
  }

  let topStrategyName = 'BALANCEO_INTELIGENTE_FONDO_MULTICOLUMNA';
  let maxCount = -1;
  for (const [strategy, count] of strategyCounts.entries()) {
    if (count > maxCount) {
      maxCount = count;
      topStrategyName = strategy;
    }
  }

  return {
    learnedOptimizationsCount: totalRuns,
    learnedProfilesCount,
    totalRuns,
    averageSavedLengthMm,
    averageSavedCm,
    totalSavedLengthMm,
    bestUtilizationPercent,
    topStrategyName,
  };
}

/**
 * Reinicia la memoria de aprendizaje (útil para pruebas unitarias).
 */
export function resetLearningMemory(): void {
  inMemoryFallbackStore = createEmptyStore();
  try {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis && globalThis.localStorage) {
      globalThis.localStorage.removeItem(NESTING_LEARNING_STORAGE_KEY);
    }
  } catch {
    // Ignorar en entornos sin localStorage
  }
}

export const nestingLearningService = {
  STORAGE_KEY: NESTING_LEARNING_STORAGE_KEY,
  buildProfileKey,
  generateProfileKey: buildProfileKey,
  computeAspectRatioBucketFromPieces,
  normalizeAspectRatioBucket,
  recordOptimizationRun,
  getLearnedProfile,
  getSmartRecommendationSummary,
  getLearningStats,
  resetLearningMemory,
};

export default nestingLearningService;
