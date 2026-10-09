import { OrderItem } from '@/modules/orders/types';
import { MasterDesign } from '@/modules/designs/types';
import { PatternSet, PieceType } from '@/modules/patterns/types';
import { GeneratedPiece } from '@/modules/generator/types';
import { PlacedNestingPiece } from '@/core/nesting/types';
import { normalizeSizeName } from '@/modules/orders/orderValidator';
import { AppView } from '@/modules/navigation/navigationStore';
import { getOrientedPolygon, doPolygonsOverlap } from '@/core/geometry/transform';

export type PreflightSeverity = 'ERROR' | 'ADVERTENCIA' | 'INFORMACION';

export interface PreflightIssue {
  id: string;
  severity: PreflightSeverity;
  category: 'ORDER' | 'DESIGN' | 'PATTERNS' | 'FONTS' | 'GENERATION' | 'NESTING' | 'EXPORT';
  title: string;
  description: string;
  actionText?: string;
  actionView?: AppView;
  affectedCount?: number;
  details?: string[];
}

export interface PreflightResult {
  canProceedToGeneration: boolean;
  canProceedToRoll: boolean;
  canExport: boolean;
  errors: PreflightIssue[];
  warnings: PreflightIssue[];
  infos: PreflightIssue[];
  expectedPieceCount: number;
  generatedPieceCount: number;
  placedPieceCount: number;
}

export interface PreflightInput {
  orderItems: OrderItem[];
  masterDesign: MasterDesign | null;
  patternSet: PatternSet | null;
  generatedPieces?: GeneratedPiece[];
  placedPieces?: PlacedNestingPiece[];
  rollWidthMm?: number;
  productionScope?: 'ALL' | 'CAMISETA_ONLY' | 'SHORT_ONLY';
}

/**
 * Calcula la cantidad teórica de piezas físicas que deben producirse
 */
export function calculateExpectedPieces(
  orderItems: OrderItem[],
  scope: 'ALL' | 'CAMISETA_ONLY' | 'SHORT_ONLY' = 'ALL'
): number {
  let count = 0;
  for (const item of orderItems) {
    if (!item.isValid) continue;
    const qty = item.quantity || 1;
    const effGarment = scope === 'CAMISETA_ONLY' ? 'CAMISETA' : scope === 'SHORT_ONLY' ? 'SHORT' : item.garmentType;

    if (effGarment === 'CAMISETA') {
      count += 4 * qty; // 1 Frente + 1 Espalda + 2 Mangas
    } else if (effGarment === 'SHORT') {
      count += 2 * qty; // 2 Pantalonetas (Izq + Der)
    } else {
      count += 6 * qty; // 4 Camiseta + 2 Short
    }
  }
  return count;
}

/**
 * Validador Central de Producción (Production Preflight)
 * Audita rigurosamente todo el flujo: Pedido -> Diseño -> Moldes -> Tipografía -> Generación -> Nesting -> Exportación
 */
export function validateProductionPreflight(input: PreflightInput): PreflightResult {
  const {
    orderItems,
    masterDesign,
    patternSet,
    generatedPieces = [],
    placedPieces = [],
    rollWidthMm = 1120,
    productionScope = 'ALL',
  } = input;

  const errors: PreflightIssue[] = [];
  const warnings: PreflightIssue[] = [];
  const infos: PreflightIssue[] = [];

  const validItems = orderItems.filter((it) => it.isValid);
  const invalidItems = orderItems.filter((it) => !it.isValid);
  const expectedPieceCount = calculateExpectedPieces(orderItems, productionScope);
  const generatedPieceCount = generatedPieces.length;
  const placedPieceCount = placedPieces.length;

  // ---------------------------------------------------------------------------
  // 1. AUDITORÍA DE PEDIDO (ORDERS)
  // ---------------------------------------------------------------------------
  if (orderItems.length === 0) {
    errors.push({
      id: 'ORDER_EMPTY',
      severity: 'ERROR',
      category: 'ORDER',
      title: 'No hay pedido cargado',
      description: 'Debes cargar una lista de jugadores desde Excel o ingresarlos manualmente en Nuevo Pedido.',
      actionText: 'Ir a Nuevo Pedido',
      actionView: 'NEW_ORDER',
    });
  } else {
    if (invalidItems.length > 0) {
      errors.push({
        id: 'ORDER_INVALID_ROWS',
        severity: 'ERROR',
        category: 'ORDER',
        title: `${invalidItems.length} registros con errores en el pedido`,
        description: 'Existen filas con nombres vacíos, tallas no reconocidas o números duplicados que deben corregirse.',
        actionText: 'Corregir en Pedido',
        actionView: 'NEW_ORDER',
        affectedCount: invalidItems.length,
        details: invalidItems.map((it) => `Fila #${it.rowNumber}: ${it.playerName || 'Sin nombre'} (${it.errors.map((e) => e.message).join(', ')})`),
      });
    }

    infos.push({
      id: 'ORDER_STATS',
      severity: 'INFORMACION',
      category: 'ORDER',
      title: `${validItems.length} jugadores válidos (${expectedPieceCount} piezas requeridas)`,
      description: `Pedido procesado con ${validItems.length} uniformes listos para corte.`,
    });
  }

  // ---------------------------------------------------------------------------
  // 2. AUDITORÍA DE DISEÑO MAESTRO (DESIGNS & VARIANTES DE CUELLO)
  // ---------------------------------------------------------------------------
  if (!masterDesign) {
    errors.push({
      id: 'DESIGN_MISSING',
      severity: 'ERROR',
      category: 'DESIGN',
      title: 'No hay diseño maestro seleccionado',
      description: 'Selecciona o carga un diseño en la Biblioteca de Diseños Maestros con los artes vectoriales correspondientes.',
      actionText: 'Ir a Diseños',
      actionView: 'DESIGNS',
    });
  } else {
    const artworks = masterDesign.pieceArtworks || {};

    // Comprobar cuello redondo vs cuello V
    const playersWantsV = validItems.filter((it) => (it.garmentType === 'CAMISETA' || it.garmentType === 'COMPLETO') && (it.necklineType === 'V' || (!it.necklineType && (it.notes || '').toUpperCase().includes('V'))));
    const playersWantsRedondo = validItems.filter((it) => (it.garmentType === 'CAMISETA' || it.garmentType === 'COMPLETO') && it.necklineType !== 'V' && !(!it.necklineType && (it.notes || '').toUpperCase().includes('V')));

    const hasDelanteroRedondo = Boolean(artworks['DELANTERO_REDONDO'] || artworks['DELANTERO']);
    const hasDelanteroV = Boolean(artworks['DELANTERO_V'] || artworks['DELANTERO']);
    const hasEspalda = Boolean(artworks['ESPALDA']);
    const hasMangas = Boolean(artworks['MANGA_IZQ'] || artworks['MANGA_DER'] || artworks['DELANTERO']);
    const hasShorts = Boolean(artworks['PANTALONETA_IZQ'] || artworks['PANTALONETA_DER'] || artworks['SHORT_FRENTE'] || artworks['SHORT_ESPALDA']);

    // Validar cuello V
    if (playersWantsV.length > 0 && !hasDelanteroV) {
      errors.push({
        id: 'DESIGN_MISSING_DELANTERO_V',
        severity: 'ERROR',
        category: 'DESIGN',
        title: `Falta arte de Delantero Cuello V para ${playersWantsV.length} jugadores`,
        description: 'El diseño maestro no tiene cargado el arte vectorial para Cuello V. Cárgalo en Diseños Maestros.',
        actionText: 'Cargar Cuello V',
        actionView: 'DESIGNS',
        affectedCount: playersWantsV.length,
        details: playersWantsV.map((p) => `${p.playerName} (#${p.playerNumber}, T${p.sizeName})`),
      });
    }

    // Validar cuello Redondo
    if (playersWantsRedondo.length > 0 && !hasDelanteroRedondo) {
      errors.push({
        id: 'DESIGN_MISSING_DELANTERO_REDONDO',
        severity: 'ERROR',
        category: 'DESIGN',
        title: `Falta arte de Delantero Cuello Redondo para ${playersWantsRedondo.length} jugadores`,
        description: 'El diseño maestro no tiene cargado el arte vectorial para Cuello Redondo.',
        actionText: 'Cargar Cuello Redondo',
        actionView: 'DESIGNS',
        affectedCount: playersWantsRedondo.length,
        details: playersWantsRedondo.map((p) => `${p.playerName} (#${p.playerNumber}, T${p.sizeName})`),
      });
    }

    // Validar espalda
    if ((playersWantsV.length > 0 || playersWantsRedondo.length > 0) && !hasEspalda) {
      errors.push({
        id: 'DESIGN_MISSING_ESPALDA',
        severity: 'ERROR',
        category: 'DESIGN',
        title: 'Falta arte vectorial de la Espalda',
        description: 'El diseño maestro no contiene el arte de la espalda para la estampación de nombres y números.',
        actionText: 'Cargar Espalda',
        actionView: 'DESIGNS',
      });
    }

    // Validar shorts si el pedido incluye shorts
    const playersWithShorts = validItems.filter((it) => it.garmentType === 'SHORT' || it.garmentType === 'COMPLETO');
    if (playersWithShorts.length > 0 && !hasShorts && productionScope !== 'CAMISETA_ONLY') {
      errors.push({
        id: 'DESIGN_MISSING_SHORTS',
        severity: 'ERROR',
        category: 'DESIGN',
        title: `Falta diseño de Pantalonetas para ${playersWithShorts.length} uniformes`,
        description: 'El pedido incluye shorts/pantalonetas pero el diseño maestro no tiene cargado el arte de piernas.',
        actionText: 'Cargar Pantaloneta',
        actionView: 'DESIGNS',
        affectedCount: playersWithShorts.length,
      });
    }

    // Advertencia si diseño usa delantero genérico legacy
    if (artworks['DELANTERO'] && !artworks['DELANTERO_REDONDO'] && !artworks['DELANTERO_V']) {
      warnings.push({
        id: 'DESIGN_LEGACY_DELANTERO',
        severity: 'ADVERTENCIA',
        category: 'DESIGN',
        title: 'Diseño utiliza Delantero Genérico (Requiere Revisión)',
        description: 'Este diseño tiene un único delantero genérico. Se recomienda definir explícitamente Delantero Redondo y Delantero V para máxima precisión de corte.',
        actionText: 'Separar Cuellos',
        actionView: 'DESIGNS',
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 3. AUDITORÍA DE MOLDES & PATRONES (PATTERNS & TALLAS EXACTAS)
  // ---------------------------------------------------------------------------
  if (!patternSet) {
    errors.push({
      id: 'PATTERNS_MISSING',
      severity: 'ERROR',
      category: 'PATTERNS',
      title: 'No hay conjunto de moldes seleccionado',
      description: 'Selecciona o importa un conjunto de moldes vectoriales 1:1 en el módulo de Moldes.',
      actionText: 'Ir a Moldes',
      actionView: 'PATTERNS',
    });
  } else {
    // Verificar que todas las tallas del pedido existan explícitamente en el molde (CERO sustitución silenciosa)
    const distinctSizes = Array.from(new Set(validItems.map((it) => normalizeSizeName(it.sizeName).toUpperCase())));
    const missingSizes: string[] = [];

    for (const sizeName of distinctSizes) {
      const sizeObj = patternSet.sizes.find(
        (s) => normalizeSizeName(s.sizeName).toUpperCase() === sizeName && s.pieces.length > 0
      );
      if (!sizeObj) {
        missingSizes.push(sizeName);
      }
    }

    if (missingSizes.length > 0) {
      const affectedPlayers = validItems.filter((it) => missingSizes.includes(normalizeSizeName(it.sizeName).toUpperCase()));
      errors.push({
        id: 'PATTERNS_MISSING_SIZES',
        severity: 'ERROR',
        category: 'PATTERNS',
        title: `Faltan moldes para ${missingSizes.length} tallas requeridas (${missingSizes.map((s) => `T${s}`).join(', ')})`,
        description: `Existen ${affectedPlayers.length} jugadores con tallas que no existen en el molde actual. Está prohibida la sustitución automática de tallas.`,
        actionText: 'Importar Tallas a Moldes',
        actionView: 'PATTERNS',
        affectedCount: affectedPlayers.length,
        details: affectedPlayers.map((p) => `${p.playerName} (#${p.playerNumber}, Talla ${p.sizeName})`),
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 4. AUDITORÍA DE GENERACIÓN PARAMÉTRICA (PIECE COUNT & INTEGRITY)
  // ---------------------------------------------------------------------------
  if (generatedPieces.length > 0) {
    if (generatedPieces.length !== expectedPieceCount) {
      errors.push({
        id: 'GENERATION_COUNT_MISMATCH',
        severity: 'ERROR',
        category: 'GENERATION',
        title: `Discrepancia en piezas: esperadas ${expectedPieceCount}, generadas ${generatedPieces.length}`,
        description: 'La cantidad de piezas generadas no coincide con las requeridas por el pedido. Revisa si alguna talla o jugador fue omitido.',
        actionText: 'Regenerar Piezas',
        actionView: 'NESTING',
      });
    }

    // Verificar que no existan piezas con polígonos degenerados o dimensiones 0
    const invalidDimensions = generatedPieces.filter((p) => !p.bbox || p.bbox.width <= 0 || p.bbox.height <= 0 || !p.cutPolygon || p.cutPolygon.length < 3);
    if (invalidDimensions.length > 0) {
      errors.push({
        id: 'GENERATION_INVALID_BBOX',
        severity: 'ERROR',
        category: 'GENERATION',
        title: `${invalidDimensions.length} piezas con geometría inválida o tamaño 0`,
        description: 'Existen piezas cuyo polígono de corte está vacío o corrupto.',
        affectedCount: invalidDimensions.length,
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 5. AUDITORÍA DE NESTING EN ROLLO (CONTENCIÓN DE 1120 mm Y SOLAPAMIENTOS)
  // ---------------------------------------------------------------------------
  if (placedPieces.length > 0) {
    // 5.1 Verificar contención estricta en el ancho de la bobina
    const outOfBounds = placedPieces.filter((p) => {
      const rightEdge = p.xMm + p.effectiveWidthMm;
      return p.xMm < -0.01 || rightEdge > rollWidthMm + 0.05;
    });

    if (outOfBounds.length > 0) {
      errors.push({
        id: 'NESTING_OUT_OF_BOUNDS',
        severity: 'ERROR',
        category: 'NESTING',
        title: `${outOfBounds.length} piezas se salen del ancho de bobina (${rollWidthMm} mm)`,
        description: 'Hay piezas que superan el margen del rollo. Ejecuta la optimización automática de nesting o reubica las piezas.',
        actionText: 'Optimizar Nesting',
        actionView: 'NESTING',
        affectedCount: outOfBounds.length,
        details: outOfBounds.map((p) => `${p.playerName} (${p.pieceType}) -> X: ${p.xMm.toFixed(1)} mm, Ancho: ${p.effectiveWidthMm.toFixed(1)} mm`),
      });
    }

    // 5.2 Verificar solapamientos físicos entre piezas
    let overlapCount = 0;
    for (let i = 0; i < placedPieces.length; i++) {
      for (let j = i + 1; j < placedPieces.length; j++) {
        const p1 = placedPieces[i];
        const p2 = placedPieces[j];

        // Bounding box pre-check
        const r1 = p1.xMm + p1.effectiveWidthMm;
        const b1 = p1.yMm + p1.effectiveHeightMm;
        const r2 = p2.xMm + p2.effectiveWidthMm;
        const b2 = p2.yMm + p2.effectiveHeightMm;

        if (p1.xMm < r2 && r1 > p2.xMm && p1.yMm < b2 && b1 > p2.yMm) {
          const poly1 = getOrientedPolygon(p1.cutPolygon, p1.rotationDeg, p1.xMm, p1.yMm);
          const poly2 = getOrientedPolygon(p2.cutPolygon, p2.rotationDeg, p2.xMm, p2.yMm);
          if (doPolygonsOverlap(poly1, poly2)) {
            overlapCount++;
          }
        }
      }
    }

    if (overlapCount > 0) {
      errors.push({
        id: 'NESTING_OVERLAP_DETECTED',
        severity: 'ERROR',
        category: 'NESTING',
        title: `Se detectaron ${overlapCount} solapamientos de piezas en el rollo`,
        description: 'Existen piezas montadas una sobre otra. Esto arruinaría el corte en taller. Reorganiza el rollo.',
        actionText: 'Reorganizar Rollo',
        actionView: 'NESTING',
        affectedCount: overlapCount,
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 6. DECISIÓN DE ESTADOS Y BLOQUEOS
  // ---------------------------------------------------------------------------
  const hasErrors = errors.length > 0;
  const canProceedToGeneration = !errors.some((e) => e.category === 'ORDER' || e.category === 'DESIGN' || e.category === 'PATTERNS');
  const canProceedToRoll = canProceedToGeneration && generatedPieces.length > 0 && !errors.some((e) => e.category === 'GENERATION');
  const canExport = canProceedToRoll && placedPieces.length > 0 && !errors.some((e) => e.category === 'NESTING');

  return {
    canProceedToGeneration,
    canProceedToRoll,
    canExport,
    errors,
    warnings,
    infos,
    expectedPieceCount,
    generatedPieceCount,
    placedPieceCount,
  };
}
