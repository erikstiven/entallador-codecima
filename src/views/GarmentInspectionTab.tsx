import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Eye,
  Sliders,
  RotateCcw,
  Type,
  Hash,
  Layers,
  Shield,
  X,
  Grid,
  Ruler,
  Shirt,
  Scissors,
  Palette,
  Sparkles,
  Tag,
} from 'lucide-react';
import { GeneratedPiece, GenerationConfig } from '@/modules/generator/types';
import { PieceType } from '@/core/geometry/types';
import { resolvePieceSvg, getPieceMoldPath } from '@/modules/generator/garmentGenerator';
import { useNavigationStore } from '@/modules/navigation/navigationStore';
import { useGeneratorStore } from '@/modules/generator/generatorStore';
import { useDesignStore } from '@/modules/designs/designStore';
import { useSystemSettingsStore } from '@/modules/settings/systemSettingsStore';
import { toMm } from '@/core/units/units';
import { useUnits } from '@/core/units/useUnits';

interface GarmentInspectionTabProps {
  generatedPieces: GeneratedPiece[];
  totalGarments: number;
  onProceedToRoll: (scope?: 'ALL' | 'CAMISETA_ONLY' | 'SHORT_ONLY') => void;
}

interface PlayerGarmentGroup {
  orderItemId: string;
  playerName: string;
  playerNumber: string;
  sizeName: string;
  pieces: GeneratedPiece[];
}

export type CalibrationZone = 'MANGAS' | 'ESPALDA' | 'FRENTE' | 'PANTALONETA';

/**
 * Formatea una distancia en milímetros a lenguaje humano claro (cm + mm).
 */
function formatDistance(mm: number): string {
  const absMm = Math.abs(Math.round(mm));
  if (absMm === 0) return '0 cm';
  const cm = absMm / 10;
  const cmText = Number.isInteger(cm) ? `${cm} cm` : `${cm.toFixed(1)} cm`;
  return absMm >= 10 ? `${cmText} (${absMm} mm)` : `${absMm} mm (${cm.toFixed(1)} cm)`;
}

/**
 * Resumen corto de desplazamiento vertical para las tarjetas de zona.
 */
function formatOffsetSummary(offsetMm: number, defaultText = 'Posición original'): string {
  const rounded = Math.round(offsetMm || 0);
  if (rounded < 0) {
    return `Subido ${(Math.abs(rounded) / 10).toFixed(1)} cm (Espacio para costura)`;
  }
  if (rounded > 0) {
    return `Bajado ${(rounded / 10).toFixed(1)} cm hacia el borde`;
  }
  return defaultText;
}

function getPieceZone(pieceType: string): CalibrationZone {
  if (pieceType.startsWith('MANGA')) return 'MANGAS';
  if (pieceType === 'ESPALDA') return 'ESPALDA';
  if (pieceType.startsWith('DELANTERO')) return 'FRENTE';
  return 'PANTALONETA';
}

function getHumanPieceTitle(pieceType: string): string {
  switch (pieceType) {
    case 'DELANTERO':
      return 'Pecho / Frente';
    case 'DELANTERO_V':
      return 'Pecho / Frente (Cuello V)';
    case 'DELANTERO_REDONDO':
      return 'Pecho / Frente (Cuello Redondo)';
    case 'ESPALDA':
      return 'Espalda (Nombre y Número)';
    case 'MANGA_IZQ':
      return 'Manga Izquierda';
    case 'MANGA_DER':
      return 'Manga Derecha';
    case 'PANTALONETA_IZQ':
    case 'SHORT_FRENTE':
      return 'Pantaloneta (Pierna Izquierda)';
    case 'PANTALONETA_DER':
    case 'SHORT_ESPALDA':
      return 'Pantaloneta (Pierna Derecha)';
    default:
      return pieceType.replace(/_/g, ' ');
  }
}

interface InspectionPieceCardProps {
  piece: GeneratedPiece;
  pieceSvg: string;
  isHighlighted: boolean;
  isTechnicalGrid: boolean;
  showGuides: boolean;
  hemMarginMm: number;
  dimensionsLabel: string;
  hemLabel: string;
  onSelectZone: (zone: CalibrationZone) => void;
}

/**
 * Tarjeta memoizada por pieza:
 * - Compara `pieceSvg` como string primitivo para que al calibrar Mangas NO se re-rendericen Delantero ni Espalda.
 * - Memoiza `{ __html: pieceSvg }` para evitar que React recree los miles de nodos SVG del DOM si el SVG no cambió.
 * - Calcula `moldPathData` en O(1) (~0.005 ms) desde `piece.cutPolygon` sin ejecutar regex sobre el string SVG de 2–4 MB.
 */
const InspectionPieceCard = React.memo<InspectionPieceCardProps>(
  ({
    piece,
    pieceSvg,
    isHighlighted,
    isTechnicalGrid,
    showGuides,
    hemMarginMm,
    dimensionsLabel,
    hemLabel,
    onSelectZone,
  }) => {
    const isEspalda = piece.pieceType === 'ESPALDA';
    const isDelantero = piece.pieceType.startsWith('DELANTERO');
    const isManga = piece.pieceType.startsWith('MANGA');
    const zone = getPieceZone(piece.pieceType);

    // Memoizar el objeto dangerouslySetInnerHTML para que React jamás toque el DOM SVG si pieceSvg es idéntico
    const svgInnerHtml = useMemo(() => ({ __html: pieceSvg }), [pieceSvg]);

    // Obtener el contorno del molde pre-calculado en O(1) desde pieceTemplateRegistry (Cero regex sobre pieceSvg)
    const moldPathData = useMemo(() => getPieceMoldPath(piece), [piece]);

    const slotBg = isTechnicalGrid
      ? 'bg-slate-900 border-slate-700'
      : 'bg-slate-50 border-slate-200';

    const gridOverlay = isTechnicalGrid
      ? 'bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] [background-size:14px_14px] opacity-70'
      : 'bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:12px_12px] opacity-60';

    const moldStrokeColor = isHighlighted ? '#7c3aed' : '#2563eb';
    const hemLineY = Math.max(10, piece.bbox.height - hemMarginMm);

    return (
      <div
        onClick={() => onSelectZone(zone)}
        className={`bg-white rounded-xl overflow-hidden flex flex-col justify-between transition-all cursor-pointer group ${
          isHighlighted
            ? 'border-2 border-violet-600 ring-2 ring-violet-500/20 shadow-md'
            : 'border border-slate-200 hover:border-violet-500/50 shadow-xs'
        }`}
      >
        {/* Header de la tarjeta */}
        <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                isHighlighted
                  ? 'bg-violet-600 animate-pulse'
                  : isEspalda
                  ? 'bg-purple-500'
                  : isDelantero
                  ? 'bg-sky-500'
                  : 'bg-amber-500'
              }`}
            />
            <span className="font-bold text-slate-800 truncate">
              {getHumanPieceTitle(piece.pieceType)}
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200 flex-shrink-0">
            {dimensionsLabel}
          </span>
        </div>

        {/* Etiqueta flotante de conexión visual cuando esta zona está activa en calibración */}
        {isHighlighted && (
          <div className="bg-violet-50 border-b border-violet-200 px-3 py-1 flex items-center justify-between text-[11px] font-semibold text-violet-700">
            <span>🎯 Ajustando esta pieza en vivo</span>
            <span className="text-[10px] text-violet-600 font-normal">Cambios al instante</span>
          </div>
        )}

        {/* Visor SVG de la pieza */}
        <div
          className={`p-4 ${slotBg} flex items-center justify-center relative min-h-[360px] h-[410px] overflow-hidden select-none transition-colors duration-200`}
        >
          <div className={`absolute inset-0 ${gridOverlay} pointer-events-none`} />

          <svg
            viewBox={`0 -4 ${piece.bbox.width} ${piece.bbox.height + 16}`}
            className="w-full h-full max-h-[390px] object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-transform duration-200 group-hover:scale-[1.01]"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* 1. Arte recortado con el molde */}
            <g dangerouslySetInnerHTML={svgInnerHtml} />

            {/* 2. Guías visuales de corte y límites de confección */}
            {showGuides && (
              <g className="pointer-events-none">
                {moldPathData && (
                  <path
                    d={moldPathData}
                    fill="none"
                    stroke={moldStrokeColor}
                    strokeWidth={isHighlighted ? '1.6' : '1.2'}
                    strokeLinejoin="round"
                    strokeDasharray="4 2"
                    opacity="0.95"
                  />
                )}

                {/* Guías especiales para MANGA: Línea de dobladillo y hombro */}
                {isManga && (
                  <>
                    <line
                      x1="4"
                      y1={hemLineY}
                      x2={piece.bbox.width - 4}
                      y2={hemLineY}
                      stroke="#f59e0b"
                      strokeWidth="1.2"
                      strokeDasharray="4 3"
                      opacity="0.9"
                    />
                    <text
                      x={piece.bbox.width - 8}
                      y={hemLineY - 3}
                      fill="#d97706"
                      fontSize="6"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="end"
                      opacity="0.85"
                    >
                      Dobladillo ({hemLabel})
                    </text>

                    <line
                      x1="10"
                      y1="6"
                      x2={piece.bbox.width - 10}
                      y2="6"
                      stroke="#10b981"
                      strokeWidth="0.8"
                      strokeDasharray="3 2"
                      opacity="0.8"
                    />
                    <text
                      x={piece.bbox.width / 2}
                      y="4.5"
                      fill="#34d399"
                      fontSize="5.5"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                      opacity="0.9"
                    >
                      LÍMITE SUPERIOR (HOMBRO)
                    </text>
                  </>
                )}

                {/* Guía de centro para ESPALDA */}
                {isEspalda && (
                  <line
                    x1={piece.bbox.width / 2}
                    y1="10"
                    x2={piece.bbox.width / 2}
                    y2={piece.bbox.height - 10}
                    stroke="#10b981"
                    strokeWidth="0.6"
                    strokeDasharray="3 3"
                    opacity="0.4"
                  />
                )}
              </g>
            )}
          </svg>
        </div>

        {/* Footer limpio y entendible */}
        <div className="px-3.5 py-2 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
          {isEspalda ? (
            <span className="text-slate-800 font-bold">
              {piece.playerName} <span className="text-purple-600">#{piece.playerNumber}</span>
            </span>
          ) : (
            <span className="text-slate-700 font-medium">{getHumanPieceTitle(piece.pieceType)}</span>
          )}
          <span className="text-violet-600 text-[10px] font-semibold">
            {isHighlighted ? '🎯 Zona seleccionada' : 'Clic para ajustar'}
          </span>
        </div>
      </div>
    );
  },
  (prev, next) =>
    prev.piece.id === next.piece.id &&
    prev.pieceSvg === next.pieceSvg &&
    prev.isHighlighted === next.isHighlighted &&
    prev.isTechnicalGrid === next.isTechnicalGrid &&
    prev.showGuides === next.showGuides &&
    prev.hemMarginMm === next.hemMarginMm &&
    prev.dimensionsLabel === next.dimensionsLabel &&
    prev.hemLabel === next.hemLabel
);

interface VisualArtworkOffsetControlProps {
  title: string;
  explanation: string;
  offsetMm: number;
  minMm?: number;
  maxMm?: number;
  onChangeOffsetMm: (newOffsetMm: number) => void;
}

/**
 * Control visual interactivo en lenguaje 100% humano para subir o bajar el dibujo
 * (usado en Mangas y en Pecho / Frente).
 */
const VisualArtworkOffsetControl: React.FC<VisualArtworkOffsetControlProps> = ({
  title,
  explanation,
  offsetMm,
  minMm = -80,
  maxMm = 40,
  onChangeOffsetMm,
}) => {
  const roundedOffset = Math.round(offsetMm || 0);
  const clamp = (val: number) => Math.max(minMm, Math.min(maxMm, Math.round(val)));
  const freeBottomPercent = roundedOffset < 0 ? Math.min(45, Math.max(8, (Math.abs(roundedOffset) / 80) * 45)) : 0;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3.5">
      {/* Encabezado y explicación humana */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span>{title}</span>
          </h4>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{explanation}</p>
        </div>

        {/* Botón único para restablecer a posición original */}
        <button
          type="button"
          onClick={() => onChangeOffsetMm(0)}
          disabled={roundedOffset === 0}
          className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 self-start md:self-auto cursor-pointer transition-all shadow-2xs"
          title="Restablecer posición original del dibujo (0 mm)"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Restablecer Posición Original</span>
        </button>
      </div>

      {/* Indicador Visual de Estado en Vivo + Representación Gráfica de Basta */}
      <div
        className={`rounded-xl border p-3 transition-all ${
          roundedOffset < 0
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : roundedOffset > 0
            ? 'bg-amber-50 border-amber-200 text-amber-900'
            : 'bg-white border-slate-200 text-slate-700'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="text-xs sm:text-sm font-bold">
            {roundedOffset < 0 ? (
              <span>
                ⬆️ Dibujo subido {formatDistance(Math.abs(roundedOffset))} — Deja{' '}
                {formatDistance(Math.abs(roundedOffset))} libres abajo para costura
              </span>
            ) : roundedOffset === 0 ? (
              <span>🎯 Dibujo en su posición original (Sin mover)</span>
            ) : (
              <span>⬇️ Dibujo bajado {formatDistance(roundedOffset)} hacia el borde inferior</span>
            )}
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 self-start sm:self-auto shadow-2xs">
            {roundedOffset === 0
              ? 'Original (0 cm)'
              : roundedOffset < 0
              ? `Subido ${formatDistance(Math.abs(roundedOffset))}`
              : `Bajado ${formatDistance(roundedOffset)}`}
          </span>
        </div>

        {/* Barra gráfica que muestra el margen de basta en la parte inferior */}
        <div className="mt-2.5 bg-white rounded-lg border border-slate-200 p-2 flex items-center gap-3 shadow-2xs">
          <div className="w-16 h-12 rounded border border-slate-300 bg-slate-50 relative overflow-hidden flex flex-col justify-between flex-shrink-0">
            <div className="flex-1 bg-gradient-to-b from-violet-500/10 to-indigo-500/10 flex items-center justify-center text-[9px] font-bold text-violet-800">
              DIBUJO
            </div>
            {roundedOffset < 0 && (
              <div
                style={{ height: `${freeBottomPercent}%` }}
                className="w-full bg-emerald-500/20 border-t border-dashed border-emerald-400 flex items-center justify-center text-[8px] font-bold text-emerald-800"
              >
                COSTURA
              </div>
            )}
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Margen libre inferior para dobladillo (basta):</span>
              <span className="font-bold text-emerald-700">
                {roundedOffset < 0 ? formatDistance(Math.abs(roundedOffset)) : 'Sin margen extra (0 cm)'}
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div
                className={`h-full transition-all duration-150 ${
                  roundedOffset < 0 ? 'bg-gradient-to-r from-emerald-500 to-cyan-500' : 'bg-slate-300'
                }`}
                style={{
                  width: `${roundedOffset < 0 ? Math.min(100, (Math.abs(roundedOffset) / 40) * 100) : 0}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Botones Grandes y Claros con Flechas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => onChangeOffsetMm(clamp(roundedOffset - 5))}
          className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all"
        >
          <span>⬆️ Subir Dibujo (+5 mm)</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeOffsetMm(clamp(roundedOffset - 1))}
          className="px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
        >
          <span>⬆️ Subir un poco (+1 mm)</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeOffsetMm(clamp(roundedOffset + 1))}
          className="px-3 py-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-2xs"
        >
          <span>⬇️ Bajar un poco (-1 mm)</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeOffsetMm(clamp(roundedOffset + 5))}
          className="px-3 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
        >
          <span>⬇️ Bajar Dibujo (-5 mm)</span>
        </button>
      </div>

      {/* Control Deslizante Interactivo (Slider en vivo) */}
      <div className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 space-y-1.5 shadow-2xs">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
          <span>⬅️ Bajar dibujo</span>
          <span className="text-slate-800 font-bold">Posición Original (0)</span>
          <span className="text-emerald-700">Subir dibujo para costura ➡️</span>
        </div>
        <input
          type="range"
          min={minMm}
          max={maxMm}
          step={1}
          value={roundedOffset}
          onChange={(e) => onChangeOffsetMm(clamp(Number(e.target.value)))}
          style={{ direction: 'rtl' }}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
          title="Desliza hacia la derecha para subir el dibujo y dejar espacio de costura"
        />
      </div>

      {/* Botones Rápidos Recomendados (1 Clic) */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold text-slate-500 block">
          ⚡ Ajustes rápidos recomendados (1 solo clic):
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {[
            { label: 'Subir 1 cm (Costura fina)', value: -10, highlight: false },
            { label: '⭐ Subir 2 cm (Basta normal recomendada)', value: -20, highlight: true },
            { label: 'Subir 2.5 cm (Basta ancha)', value: -25, highlight: false },
            { label: 'Subir 3 cm (Basta extra)', value: -30, highlight: false },
          ].map((preset) => {
            const isSelected = roundedOffset === preset.value;
            return (
              <button
                key={preset.value}
                type="button"
                onClick={() => onChangeOffsetMm(preset.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
                  isSelected
                    ? 'bg-violet-600 text-white font-bold shadow-xs'
                    : preset.highlight
                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const GarmentInspectionTab: React.FC<GarmentInspectionTabProps> = ({
  generatedPieces,
  onProceedToRoll,
}) => {
  const { setCurrentView } = useNavigationStore();
  const { settings } = useSystemSettingsStore();
  const { unit, format: formatWithUnits } = useUnits();
  const {
    generationConfig,
    updateConfig: rawUpdateConfig,
    generatePieces,
  } = useGeneratorStore();
  const { activeDesign, updatePlaceholderRule } = useDesignStore();

  const [showCalibrationPanel, setShowCalibrationPanel] = useState<boolean>(true);
  const [activeZone, setActiveZone] = useState<CalibrationZone>('MANGAS');
  const [showSizeMarkConfig, setShowSizeMarkConfig] = useState<boolean>(false);
  const [isTechnicalGrid, setIsTechnicalGrid] = useState<boolean>(false);
  const [showGuides, setShowGuides] = useState<boolean>(true);

  const displayUnit = unit;
  const unitStepMm = displayUnit === 'mm' ? 1 : toMm(0.1, displayUnit);
  const formatDisplayMm = (valueMm: number) => formatWithUnits(valueMm);

  /**
   * Actualización directa e inmediata (1 solo render por acción, sin setTimeout ni triple re-render).
   */
  const applyCalibrationChange = useCallback(
    (partial: Partial<GenerationConfig> & { shortArtOffsetYMm?: number }) => {
      rawUpdateConfig(partial);
    },
    [rawUpdateConfig]
  );

  // Actualizar colores o grosor de borde del dorsal directamente en el Diseño Maestro activo
  const applyDorsalStyleChange = useCallback(
    (styleUpdates: { fillColor?: string; strokeColor?: string; strokeWidthMm?: number }) => {
      if (!activeDesign) return;
      for (const [pieceTypeKey, artwork] of Object.entries(activeDesign.pieceArtworks)) {
        if (!artwork?.placeholders) continue;
        for (const rule of artwork.placeholders) {
          updatePlaceholderRule(activeDesign.id, pieceTypeKey as PieceType, rule.id, styleUpdates);
        }
      }
      generatePieces();
    },
    [activeDesign, updatePlaceholderRule, generatePieces]
  );

  const espaldaPlaceholders = activeDesign?.pieceArtworks?.['ESPALDA']?.placeholders || [];
  const currentDorsalFill = espaldaPlaceholders[0]?.fillColor || activeDesign?.colors?.[2] || '#ffffff';
  const currentDorsalStroke = espaldaPlaceholders[0]?.strokeColor || '#000000';
  const currentDorsalStrokeWidth = espaldaPlaceholders[0]?.strokeWidthMm ?? 2.5;

  // Agrupar piezas por cada jugador en la nómina
  const playerGroups = useMemo<PlayerGarmentGroup[]>(() => {
    const map = new Map<string, PlayerGarmentGroup>();
    for (const piece of generatedPieces) {
      const key = piece.orderItemId || `${piece.playerName}_${piece.playerNumber}_${piece.sizeName}`;
      if (!map.has(key)) {
        map.set(key, {
          orderItemId: piece.orderItemId,
          playerName: piece.playerName,
          playerNumber: piece.playerNumber,
          sizeName: piece.sizeName,
          pieces: [],
        });
      }
      map.get(key)!.pieces.push(piece);
    }
    return Array.from(map.values());
  }, [generatedPieces]);

  // Detectar si el pedido incluye piezas de pantaloneta
  const orderHasShorts = useMemo(
    () =>
      generatedPieces.some(
        (p) => p.pieceType.startsWith('SHORT') || p.pieceType.startsWith('PANTALONETA')
      ),
    [generatedPieces]
  );

  const availableSizes = useMemo(() => {
    const set = new Set<string>();
    for (const g of playerGroups) {
      set.add(g.sizeName);
    }
    return Array.from(set).sort();
  }, [playerGroups]);

  const [selectedSizeFilter, setSelectedSizeFilter] = useState<string>('TODAS');
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState<number>(0);
  const [garmentTypeFilter, setGarmentTypeFilter] = useState<'CAMISETA' | 'SHORT' | 'ALL'>('CAMISETA');

  const filteredPlayers = useMemo(() => {
    if (selectedSizeFilter === 'TODAS') return playerGroups;
    return playerGroups.filter((g) => g.sizeName === selectedSizeFilter);
  }, [playerGroups, selectedSizeFilter]);

  const currentPlayer = filteredPlayers[selectedPlayerIndex] || filteredPlayers[0];

  const handleSelectPlayer = (idx: number) => {
    setSelectedPlayerIndex(idx);
  };

  const handleNextPlayer = () => {
    if (selectedPlayerIndex < filteredPlayers.length - 1) {
      handleSelectPlayer(selectedPlayerIndex + 1);
    }
  };

  const handlePrevPlayer = () => {
    if (selectedPlayerIndex > 0) {
      handleSelectPlayer(selectedPlayerIndex - 1);
    }
  };

  const getPieceOrder = (type: string) => {
    if (type.startsWith('DELANTERO')) return 1;
    if (type.startsWith('ESPALDA')) return 2;
    if (type.startsWith('MANGA')) return 3;
    if (type.startsWith('SHORT') || type.startsWith('PANTALONETA')) return 4;
    return 5;
  };

  const sortedPieces = useMemo(() => {
    if (!currentPlayer) return [];
    let pieces = currentPlayer.pieces;
    if (garmentTypeFilter === 'CAMISETA') {
      pieces = pieces.filter(
        (p) =>
          p.pieceType.startsWith('DELANTERO') ||
          p.pieceType === 'ESPALDA' ||
          p.pieceType.startsWith('MANGA')
      );
    } else if (garmentTypeFilter === 'SHORT') {
      pieces = pieces.filter(
        (p) => p.pieceType.startsWith('SHORT') || p.pieceType.startsWith('PANTALONETA')
      );
    }
    return [...pieces].sort((a, b) => getPieceOrder(a.pieceType) - getPieceOrder(b.pieceType));
  }, [currentPlayer, garmentTypeFilter]);

  const handleSelectZoneFromCard = useCallback((zone: CalibrationZone) => {
    setShowCalibrationPanel(true);
    setActiveZone(zone);
  }, []);

  const handleSelectZoneTab = (zone: CalibrationZone) => {
    setActiveZone(zone);
    if (zone === 'PANTALONETA' && garmentTypeFilter === 'CAMISETA' && orderHasShorts) {
      setGarmentTypeFilter('ALL');
    } else if (zone !== 'PANTALONETA' && garmentTypeFilter === 'SHORT') {
      setGarmentTypeFilter('ALL');
    }
  };

  const handleProceedToRoll = () => {
    const scope =
      garmentTypeFilter === 'CAMISETA'
        ? 'CAMISETA_ONLY'
        : garmentTypeFilter === 'SHORT'
        ? 'SHORT_ONLY'
        : 'ALL';
    onProceedToRoll(scope);
  };

  const hasActiveCalibration = Boolean(
    (generationConfig.nameVerticalOffsetPercent || 0) !== 0 ||
      (generationConfig.nameScaleX || 1.0) !== 1.0 ||
      (generationConfig.nameScaleY || 1.0) !== 1.0 ||
      (generationConfig.numberVerticalOffsetPercent || 0) !== 0 ||
      (generationConfig.numberScaleX || 1.0) !== 1.0 ||
      (generationConfig.numberScaleY || 1.0) !== 1.0 ||
      (generationConfig.sleeveArtOffsetYMm || 0) !== 0 ||
      (generationConfig.frontArtOffsetYMm || 0) !== 0 ||
      (generationConfig.backArtOffsetYMm || 0) !== 0 ||
      ((generationConfig as GenerationConfig & { shortArtOffsetYMm?: number }).shortArtOffsetYMm || 0) !== 0 ||
      generationConfig.includeFrontNumber === true ||
      (generationConfig.frontNumberXPercent ?? 50) !== 50 ||
      (generationConfig.frontNumberYPercent ?? 38) !== 38 ||
      (generationConfig.frontNumberScale ?? 1) !== 1 ||
      generationConfig.includeShortNumber === false ||
      (generationConfig.shortNumberPiece || 'DER') !== 'DER' ||
      (generationConfig.shortNumberXPercent ?? 50) !== 50 ||
      (generationConfig.shortNumberYPercent ?? 45) !== 45 ||
      (generationConfig.shortNumberScale ?? 1) !== 1 ||
      generationConfig.includeSizeMark === true
  );

  // Navegación con flechas del teclado (← y →)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === 'ArrowRight') {
        if (selectedPlayerIndex < filteredPlayers.length - 1) {
          setSelectedPlayerIndex(selectedPlayerIndex + 1);
        }
      } else if (e.key === 'ArrowLeft') {
        if (selectedPlayerIndex > 0) {
          setSelectedPlayerIndex(selectedPlayerIndex - 1);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPlayerIndex, filteredPlayers.length]);

  if (playerGroups.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 bg-slate-50">
        <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center mb-4 text-slate-400 shadow-xs">
          <Eye className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">No hay prendas generadas para revisar</h3>
        <p className="text-xs text-slate-500 max-w-md mb-6">
          Ve a la pestaña "Nuevo Pedido" para cargar tu lista de jugadores desde Excel y generar las piezas de entallado.
        </p>
        <button
          onClick={() => setCurrentView('NEW_ORDER')}
          className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer"
        >
          Ir a Nuevo Pedido
        </button>
      </div>
    );
  }

  const nameScaleX = generationConfig.nameScaleX ?? 1.0;
  const nameScaleY = generationConfig.nameScaleY ?? 1.0;
  const nameOffsetPercent = generationConfig.nameVerticalOffsetPercent || 0;

  const numScaleX = generationConfig.numberScaleX ?? (generationConfig.numberScaleFactor ?? 1.0);
  const numScaleY = generationConfig.numberScaleY ?? (generationConfig.numberScaleFactor ?? 1.0);
  const numOffsetPercent = generationConfig.numberVerticalOffsetPercent || 0;

  const sleeveOffsetMm = generationConfig.sleeveArtOffsetYMm || 0;
  const frontOffsetMm = generationConfig.frontArtOffsetYMm || 0;
  const backOffsetMm = generationConfig.backArtOffsetYMm || 0;
  const shortOffsetMm =
    (generationConfig as GenerationConfig & { shortArtOffsetYMm?: number }).shortArtOffsetYMm || 0;
  const hemMarginMm = settings.defaultHemMarginMm || 20;
  const hemLabel = formatWithUnits(hemMarginMm);

  return (
    <div className="flex flex-col h-full bg-slate-100 text-slate-800 overflow-hidden">
      {/* 1. BARRA DE CONTROL PRINCIPAL UNIFICADA */}
      <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 flex-shrink-0 z-20 shadow-xs">
        {/* Izquierda: Filtro de Prendas y Tallas */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setGarmentTypeFilter('CAMISETA')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                garmentTypeFilter === 'CAMISETA'
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Mostrar camisetas (Frente, Espalda y Mangas)"
            >
              <Shirt className="w-3.5 h-3.5" />
              Camisetas
            </button>
            <button
              type="button"
              onClick={() => setGarmentTypeFilter('SHORT')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                garmentTypeFilter === 'SHORT'
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Mostrar shorts / pantalonetas"
            >
              <Scissors className="w-3.5 h-3.5" />
              Shorts
            </button>
            <button
              type="button"
              onClick={() => setGarmentTypeFilter('ALL')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                garmentTypeFilter === 'ALL'
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Mostrar todo el uniforme"
            >
              <Layers className="w-3.5 h-3.5" />
              Todo el Pedido
            </button>
          </div>

          {/* Filtro rápido por Talla */}
          <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
            <span className="text-[10px] text-slate-500 uppercase font-mono">Talla:</span>
            <select
              value={selectedSizeFilter}
              onChange={(e) => {
                setSelectedSizeFilter(e.target.value);
                setSelectedPlayerIndex(0);
              }}
              className="bg-transparent text-violet-700 font-bold font-mono focus:outline-none cursor-pointer"
            >
              <option value="TODAS" className="bg-white text-slate-800">
                Todas ({playerGroups.length})
              </option>
              {availableSizes.map((sz) => (
                <option key={sz} value={sz} className="bg-white text-slate-800">
                  T{sz} ({playerGroups.filter((g) => g.sizeName === sz).length})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Centro: Navegación de Jugador */}
        {currentPlayer && (
          <div className="flex items-center gap-2 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 font-mono text-slate-800 shadow-2xs">
            <button
              onClick={handlePrevPlayer}
              disabled={selectedPlayerIndex === 0}
              className="p-1 rounded-md hover:bg-slate-200 text-slate-500 hover:text-slate-900 disabled:opacity-20 cursor-pointer"
              title="Jugador anterior (Flecha Izquierda ←)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-slate-900 font-bold px-2">
              {currentPlayer.playerName}{' '}
              <span className="text-violet-600">#{currentPlayer.playerNumber}</span>
              <span className="text-slate-500 font-normal ml-2">
                ({selectedPlayerIndex + 1} de {filteredPlayers.length})
              </span>
            </span>
            <button
              onClick={handleNextPlayer}
              disabled={selectedPlayerIndex === filteredPlayers.length - 1}
              className="p-1 rounded-md hover:bg-slate-200 text-slate-500 hover:text-slate-900 disabled:opacity-20 cursor-pointer"
              title="Siguiente jugador (Flecha Derecha →)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Derecha: Selector de Guías, Cuadrícula y Botón de Calibración */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsTechnicalGrid(!isTechnicalGrid)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isTechnicalGrid
                ? 'bg-cyan-50 text-cyan-800 border-cyan-300 shadow-2xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-50'
            }`}
            title="Activar/Desactivar fondo cuadriculado para contrastar moldes claros u oscuros"
          >
            <Grid className="w-3.5 h-3.5 text-cyan-600" />
            <span>{isTechnicalGrid ? 'Cuadrícula: ON' : 'Cuadrícula'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowGuides(!showGuides)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              showGuides
                ? 'bg-sky-50 text-sky-800 border-sky-300 shadow-2xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-50'
            }`}
            title="Mostrar u ocultar guías de contorno de molde y línea de dobladillo"
          >
            <Ruler className="w-3.5 h-3.5 text-sky-600" />
            <span>{showGuides ? 'Guías: ON' : 'Guías: OFF'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCalibrationPanel(!showCalibrationPanel)}
            className={`px-3.5 py-1.5 rounded-lg border text-xs font-bold transition-all relative flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              showCalibrationPanel
                ? 'bg-violet-600 text-white border-violet-500 shadow-xs'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
            }`}
            title="Abrir o cerrar el asistente visual para subir dibujos, ajustar nombres y números"
          >
            <Sliders className={`w-3.5 h-3.5 ${showCalibrationPanel ? 'text-white' : 'text-amber-600'}`} />
            <span>{showCalibrationPanel ? 'Ocultar Ajustes' : 'Ajustar Diseño y Números'}</span>
            {hasActiveCalibration && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            )}
          </button>

          {hasActiveCalibration && (
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-emerald-50 border-emerald-200 text-emerald-800 text-[11px] font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>✓ Ajuste aplicado en vivo a todo el pedido</span>
            </div>
          )}

          <button
            type="button"
            disabled={generatedPieces.length === 0}
            onClick={handleProceedToRoll}
            title="Confirmar revisión de uniformes y pasar al Rollo de Sublimación"
            className="flex items-center gap-2 px-5 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:border disabled:border-slate-200 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <span>Pasar al Rollo de Sublimación</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. ÁREA CENTRAL CON PANEL DE CALIBRACIÓN VISUAL PASO A PASO + GRILLA DE PIEZAS */}
      {currentPlayer && (
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* PANEL VISUAL DE CALIBRACIÓN POR ZONAS DE LA PRENDA (100% EN LENGUAJE HUMANO) */}
          {showCalibrationPanel && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
              {/* Cabecera del panel: Título simple + Marquilla de talla + Restablecer + Cerrar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-violet-50 border border-violet-200 flex items-center justify-center text-violet-600 font-bold">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Asistente Visual de Ajuste de Prendas (En Vivo)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Elige qué parte de la prenda deseas acomodar. Todo cambio se aplica al instante a los{' '}
                      <span className="text-violet-600 font-semibold">{playerGroups.length} uniformes</span> del pedido.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Botón de Marquilla Interna de Talla (1 solo clic) */}
                  <div className="flex items-center rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs">
                    <button
                      type="button"
                      onClick={() =>
                        applyCalibrationChange({ includeSizeMark: !generationConfig.includeSizeMark })
                      }
                      className={`px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                        generationConfig.includeSizeMark
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                      title="Activar o desactivar marquilla de talla interna con 1 solo clic"
                    >
                      <Tag className="w-3.5 h-3.5" />
                      <span>
                        🏷️ Marquilla de Talla: {generationConfig.includeSizeMark ? 'Activada' : 'Desactivada'}
                      </span>
                    </button>
                    {generationConfig.includeSizeMark && (
                      <button
                        type="button"
                        onClick={() => setShowSizeMarkConfig(!showSizeMarkConfig)}
                        className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-900 border-l border-slate-200 hover:bg-slate-50 cursor-pointer"
                        title="Opciones de la marquilla (color y tamaño)"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Restablecer todos los valores */}
                  <button
                    type="button"
                    onClick={() => {
                      applyCalibrationChange({
                        nameVerticalOffsetPercent: 0,
                        nameScaleX: 1.0,
                        nameScaleY: 1.0,
                        numberVerticalOffsetPercent: 0,
                        numberScaleFactor: 1.0,
                        numberScaleX: 1.0,
                        numberScaleY: 1.0,
                        sleeveArtOffsetYMm: 0,
                        frontArtOffsetYMm: 0,
                        backArtOffsetYMm: 0,
                        shortArtOffsetYMm: 0,
                        includeFrontNumber: false,
                        frontNumberPosition: 'CENTRO',
                        frontNumberXPercent: 50,
                        frontNumberYPercent: 38,
                        frontNumberScale: 1,
                        includeShortNumber: true,
                        shortNumberPiece: 'DER',
                        shortNumberXPercent: 50,
                        shortNumberYPercent: 45,
                        shortNumberScale: 1,
                        includeSizeMark: false,
                        sizeMarkColor: '#000000',
                        sizeMarkFontSizeMm: 8,
                        sizeMarkBottomOffsetMm: 8,
                      });
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-amber-600 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                    title="Restablecer todas las piezas a sus posiciones y configuraciones predeterminadas"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restablecer posiciones predeterminadas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowCalibrationPanel(false)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-900 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cerrar</span>
                  </button>
                </div>
              </div>

              {/* Configuración desplegable opcional para Marquilla Interna de Talla */}
              {showSizeMarkConfig && (
                <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        applyCalibrationChange({ includeSizeMark: !generationConfig.includeSizeMark })
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                        generationConfig.includeSizeMark
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      {generationConfig.includeSizeMark
                        ? '✓ Imprimiendo Talla en las Piezas'
                        : 'Activar Impresión de Talla en las Piezas'}
                    </button>
                    <span className="text-xs text-slate-600">
                      Imprime una pequeña letra de talla (ej. S, M, L) en el borde inferior para guiar al costurero.
                    </span>
                  </div>

                  {generationConfig.includeSizeMark && (
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="flex items-center gap-1.5 text-xs text-slate-700">
                        <span>Color:</span>
                        <input
                          type="color"
                          value={generationConfig.sizeMarkColor || '#000000'}
                          onChange={(e) => applyCalibrationChange({ sizeMarkColor: e.target.value })}
                          className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                        />
                      </label>
                      <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs">
                        <span className="text-slate-500">Tamaño:</span>
                        <button
                          type="button"
                          onClick={() =>
                            applyCalibrationChange({
                              sizeMarkFontSizeMm: Math.max(
                                3,
                                Number(((generationConfig.sizeMarkFontSizeMm ?? 8) - unitStepMm).toFixed(2))
                              ),
                            })
                          }
                          className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold cursor-pointer"
                        >
                          −
                        </button>
                        <span className="font-mono text-emerald-700 font-bold min-w-[42px] text-center">
                          {formatDisplayMm(generationConfig.sizeMarkFontSizeMm ?? 8)}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            applyCalibrationChange({
                              sizeMarkFontSizeMm: Math.min(
                                20,
                                Number(((generationConfig.sizeMarkFontSizeMm ?? 8) + unitStepMm).toFixed(2))
                              ),
                            })
                          }
                          className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs">
                        <span className="text-slate-500">Altura desde abajo:</span>
                        <button
                          type="button"
                          onClick={() =>
                            applyCalibrationChange({
                              sizeMarkBottomOffsetMm: Math.max(
                                -20,
                                Number(((generationConfig.sizeMarkBottomOffsetMm ?? 8) - unitStepMm).toFixed(2))
                              ),
                            })
                          }
                          className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold cursor-pointer"
                        >
                          ⬇️ Bajar
                        </button>
                        <span className="font-mono text-emerald-700 font-bold min-w-[42px] text-center">
                          {formatDisplayMm(generationConfig.sizeMarkBottomOffsetMm ?? 8)}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            applyCalibrationChange({
                              sizeMarkBottomOffsetMm: Math.min(
                                50,
                                Number(((generationConfig.sizeMarkBottomOffsetMm ?? 8) + unitStepMm).toFixed(2))
                              ),
                            })
                          }
                          className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold cursor-pointer"
                        >
                          ⬆️ Subir
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 4 BOTONES / TARJETAS GRANDES DE ZONA DE LA PRENDA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* ZONA 1: MANGAS */}
                <button
                  type="button"
                  onClick={() => handleSelectZoneTab('MANGAS')}
                  className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                    activeZone === 'MANGAS'
                      ? 'bg-violet-50/70 border-2 border-violet-600 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-800">👕 Mangas (Subir / Bajar Dibujo)</span>
                    {activeZone === 'MANGAS' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-violet-600 text-white">
                        Activo
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-violet-600">
                    {formatOffsetSummary(sleeveOffsetMm, 'Posición original')}
                  </p>
                </button>

                {/* ZONA 2: ESPALDA (NOMBRE Y NÚMERO) */}
                <button
                  type="button"
                  onClick={() => handleSelectZoneTab('ESPALDA')}
                  className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                    activeZone === 'ESPALDA'
                      ? 'bg-violet-50/70 border-2 border-violet-600 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-800">🔢 Espalda (Nombre y Número)</span>
                    {activeZone === 'ESPALDA' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-violet-600 text-white">
                        Activo
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-purple-600">
                    Tamaño y posición de letras y números
                  </p>
                </button>

                {/* ZONA 3: PECHO / FRENTE */}
                <button
                  type="button"
                  onClick={() => handleSelectZoneTab('FRENTE')}
                  className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                    activeZone === 'FRENTE'
                      ? 'bg-violet-50/70 border-2 border-violet-600 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-800">🛡️ Pecho / Frente</span>
                    {activeZone === 'FRENTE' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-violet-600 text-white">
                        Activo
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-sky-600">
                    {frontOffsetMm !== 0
                      ? formatOffsetSummary(frontOffsetMm)
                      : 'Subir o bajar el dibujo del pecho'}
                  </p>
                </button>

                {/* ZONA 4: PANTALONETA */}
                <button
                  type="button"
                  onClick={() => handleSelectZoneTab('PANTALONETA')}
                  className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                    activeZone === 'PANTALONETA'
                      ? 'bg-violet-50/70 border-2 border-violet-600 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-800">🩳 Pantaloneta</span>
                    {activeZone === 'PANTALONETA' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-violet-600 text-white">
                        Activo
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-amber-700">
                    {orderHasShorts
                      ? generationConfig.includeShortNumber !== false
                        ? `Número en pierna ${generationConfig.shortNumberPiece === 'IZQ' ? 'izquierda' : 'derecha'}`
                        : 'Sin número en pantaloneta'
                      : 'Solo camisetas en este pedido'}
                  </p>
                </button>
              </div>

              {/* CONTENIDO DINÁMICO DE LA ZONA SELECCIONADA */}
              {activeZone === 'MANGAS' && (
                <VisualArtworkOffsetControl
                  title="👕 Ajuste del Dibujo en las Mangas (Izquierda y Derecha)"
                  explanation="Si al coser el dobladillo (basta) se corta el diseño o los logos de la manga, usa estos botones para subir el dibujo y dejar espacio libre abajo."
                  offsetMm={sleeveOffsetMm}
                  onChangeOffsetMm={(val) => applyCalibrationChange({ sleeveArtOffsetYMm: val })}
                />
              )}

              {activeZone === 'ESPALDA' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* BLOQUE 1: 🅰️ NOMBRE DEL JUGADOR (ARRIBA) */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <div className="flex items-center gap-2">
                          <Type className="w-4 h-4 text-purple-600" />
                          <h4 className="text-sm font-bold text-slate-900">🅰️ Nombre del Jugador (Arriba)</h4>
                        </div>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                          {Math.round(nameScaleX * 100)}% × {Math.round(nameScaleY * 100)}%
                        </span>
                      </div>

                      {/* Tamaño del Nombre */}
                      <div className="space-y-1.5">
                        <span className="text-xs font-semibold text-slate-700 block">
                          Tamaño general del Nombre:
                        </span>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              applyCalibrationChange({
                                nameScaleX: Math.max(0.3, Number((nameScaleX - 0.05).toFixed(2))),
                                nameScaleY: Math.max(0.3, Number((nameScaleY - 0.05).toFixed(2))),
                              })
                            }
                            className="px-2.5 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer active:scale-95 transition-all shadow-2xs"
                          >
                            🔍− Más Pequeño
                          </button>
                          <button
                            type="button"
                            onClick={() => applyCalibrationChange({ nameScaleX: 1.0, nameScaleY: 1.0 })}
                            className={`px-2.5 py-2 rounded-lg border text-xs font-bold cursor-pointer active:scale-95 transition-all shadow-2xs ${
                              nameScaleX === 1 && nameScaleY === 1
                                ? 'bg-purple-600 text-white border-purple-600'
                                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                            }`}
                          >
                            Normal (100%)
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              applyCalibrationChange({
                                nameScaleX: Math.min(3.0, Number((nameScaleX + 0.05).toFixed(2))),
                                nameScaleY: Math.min(3.0, Number((nameScaleY + 0.05).toFixed(2))),
                              })
                            }
                            className="px-2.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-xs font-bold text-white cursor-pointer active:scale-95 transition-all shadow-2xs"
                          >
                            🔍+ Más Grande
                          </button>
                        </div>
                      </div>

                      {/* Forma de las Letras */}
                      <div className="space-y-1.5">
                        <span className="text-xs font-semibold text-slate-700 block">
                          Forma de las Letras (Ancho y Alto):
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              applyCalibrationChange({
                                nameScaleX: Math.max(0.3, Number((nameScaleX - 0.05).toFixed(2))),
                              })
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer active:scale-95 shadow-2xs"
                          >
                            ↔️ Más Angosto
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              applyCalibrationChange({
                                nameScaleX: Math.min(3.0, Number((nameScaleX + 0.05).toFixed(2))),
                              })
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer active:scale-95 shadow-2xs"
                          >
                            ↔️ Más Ancho
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              applyCalibrationChange({
                                nameScaleY: Math.max(0.3, Number((nameScaleY - 0.05).toFixed(2))),
                              })
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer active:scale-95 shadow-2xs"
                          >
                            ↕️ Más Bajo
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              applyCalibrationChange({
                                nameScaleY: Math.min(3.0, Number((nameScaleY + 0.05).toFixed(2))),
                              })
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer active:scale-95 shadow-2xs"
                          >
                            ↕️ Más Alto
                          </button>
                        </div>
                      </div>

                      {/* Posición Vertical del Nombre */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-700">
                            Posición vertical del Nombre:
                          </span>
                          <span className="text-[11px] text-purple-700 font-semibold">
                            {nameOffsetPercent === 0
                              ? 'En su lugar original'
                              : nameOffsetPercent < 0
                              ? `Subido ${Math.abs(nameOffsetPercent)}%`
                              : `Bajado ${nameOffsetPercent}%`}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              applyCalibrationChange({
                                nameVerticalOffsetPercent: Math.max(-35, nameOffsetPercent - 1),
                              })
                            }
                            className="px-2.5 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-emerald-700 cursor-pointer active:scale-95 shadow-2xs"
                          >
                            ⬆️ Subir Nombre
                          </button>
                          <button
                            type="button"
                            onClick={() => applyCalibrationChange({ nameVerticalOffsetPercent: 0 })}
                            className="px-2 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600 cursor-pointer active:scale-95 shadow-2xs"
                          >
                            🔄 Original
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              applyCalibrationChange({
                                nameVerticalOffsetPercent: Math.min(35, nameOffsetPercent + 1),
                              })
                            }
                            className="px-2.5 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-amber-700 cursor-pointer active:scale-95 shadow-2xs"
                          >
                            ⬇️ Bajar Nombre
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* BLOQUE 2: 🔟 NÚMERO DEL JUGADOR (CENTRO) */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <div className="flex items-center gap-2">
                          <Hash className="w-4 h-4 text-violet-600" />
                          <h4 className="text-sm font-bold text-slate-900">🔟 Número del Jugador (Centro)</h4>
                        </div>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-200">
                          {Math.round(numScaleX * 100)}% × {Math.round(numScaleY * 100)}%
                        </span>
                      </div>

                      {/* Tamaño del Número */}
                      <div className="space-y-1.5">
                        <span className="text-xs font-semibold text-slate-700 block">
                          Tamaño general del Número:
                        </span>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const nextX = Math.max(0.3, Number((numScaleX - 0.05).toFixed(2)));
                              const nextY = Math.max(0.3, Number((numScaleY - 0.05).toFixed(2)));
                              applyCalibrationChange({
                                numberScaleX: nextX,
                                numberScaleY: nextY,
                                numberScaleFactor: nextY,
                              });
                            }}
                            className="px-2.5 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer active:scale-95 transition-all shadow-2xs"
                          >
                            🔍− Más Pequeño
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              applyCalibrationChange({
                                numberScaleX: 1.0,
                                numberScaleY: 1.0,
                                numberScaleFactor: 1.0,
                              })
                            }
                            className={`px-2.5 py-2 rounded-lg border text-xs font-bold cursor-pointer active:scale-95 transition-all shadow-2xs ${
                              numScaleX === 1 && numScaleY === 1
                                ? 'bg-violet-600 text-white border-violet-600'
                                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                            }`}
                          >
                            Normal (100%)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const nextX = Math.min(3.0, Number((numScaleX + 0.05).toFixed(2)));
                              const nextY = Math.min(3.0, Number((numScaleY + 0.05).toFixed(2)));
                              applyCalibrationChange({
                                numberScaleX: nextX,
                                numberScaleY: nextY,
                                numberScaleFactor: nextY,
                              });
                            }}
                            className="px-2.5 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-xs font-bold text-white cursor-pointer active:scale-95 transition-all shadow-2xs"
                          >
                            🔍+ Más Grande
                          </button>
                        </div>
                      </div>

                      {/* Forma del Número */}
                      <div className="space-y-1.5">
                        <span className="text-xs font-semibold text-slate-700 block">
                          Forma del Número (Ancho y Alto):
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              applyCalibrationChange({
                                numberScaleX: Math.max(0.3, Number((numScaleX - 0.05).toFixed(2))),
                              })
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer active:scale-95 shadow-2xs"
                          >
                            ↔️ Más Delgado
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              applyCalibrationChange({
                                numberScaleX: Math.min(3.0, Number((numScaleX + 0.05).toFixed(2))),
                              })
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer active:scale-95 shadow-2xs"
                          >
                            ↔️ Más Ancho
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const nextY = Math.max(0.3, Number((numScaleY - 0.05).toFixed(2)));
                              applyCalibrationChange({ numberScaleY: nextY, numberScaleFactor: nextY });
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer active:scale-95 shadow-2xs"
                          >
                            ↕️ Más Corto
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const nextY = Math.min(3.0, Number((numScaleY + 0.05).toFixed(2)));
                              applyCalibrationChange({ numberScaleY: nextY, numberScaleFactor: nextY });
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer active:scale-95 shadow-2xs"
                          >
                            ↕️ Más Alto
                          </button>
                        </div>
                      </div>

                      {/* Posición y Separación */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-700">
                            Posición y separación con el nombre:
                          </span>
                          <span className="text-[11px] text-violet-700 font-semibold">
                            {numOffsetPercent === 0
                              ? 'Centrado original'
                              : numOffsetPercent < 0
                              ? `Subido ${Math.abs(numOffsetPercent)}%`
                              : `Bajado ${numOffsetPercent}%`}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              applyCalibrationChange({
                                numberVerticalOffsetPercent: Math.max(-35, numOffsetPercent - 1),
                              })
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-emerald-700 cursor-pointer active:scale-95 shadow-2xs"
                          >
                            ⬆️ Subir Número
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              applyCalibrationChange({
                                numberVerticalOffsetPercent: Math.min(35, numOffsetPercent + 1),
                              })
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-amber-700 cursor-pointer active:scale-95 shadow-2xs"
                          >
                            ⬇️ Bajar Número
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              applyCalibrationChange({
                                nameVerticalOffsetPercent: Math.max(-35, nameOffsetPercent - 1),
                                numberVerticalOffsetPercent: Math.min(35, numOffsetPercent + 1),
                              })
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-sky-700 cursor-pointer active:scale-95 shadow-2xs"
                          >
                            ↕️ Separar más del nombre
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              applyCalibrationChange({
                                nameVerticalOffsetPercent: Math.min(35, nameOffsetPercent + 1),
                                numberVerticalOffsetPercent: Math.max(-35, numOffsetPercent - 1),
                              })
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-purple-700 cursor-pointer active:scale-95 shadow-2xs"
                          >
                            ↕️ Juntar al nombre
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* BLOQUE 3: 🎨 COLOR, BORDE DE LETRAS Y FONDO DE ESPALDA */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <div className="flex items-center gap-2">
                          <Palette className="w-4 h-4 text-amber-600" />
                          <h4 className="text-sm font-bold text-slate-900">
                            🎨 Color, Borde y Fondo de Espalda
                          </h4>
                        </div>
                      </div>

                      {/* Color de Relleno y Color de Borde */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-700">Color de Letra:</span>
                            <input
                              type="color"
                              value={currentDorsalFill}
                              onChange={(e) => applyDorsalStyleChange({ fillColor: e.target.value })}
                              className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                              title="Elegir cualquier color para el nombre y número"
                            />
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {['#ffffff', '#000000', '#facc15', '#ef4444', '#3b82f6', '#10b981'].map(
                              (hex) => (
                                <button
                                  key={hex}
                                  type="button"
                                  onClick={() => applyDorsalStyleChange({ fillColor: hex })}
                                  className={`w-5 h-5 rounded-full border cursor-pointer transition-transform ${
                                    currentDorsalFill.toLowerCase() === hex
                                      ? 'ring-2 ring-violet-500 scale-110 border-white'
                                      : 'border-slate-300 hover:scale-105'
                                  }`}
                                  style={{ backgroundColor: hex }}
                                  title={`Color ${hex}`}
                                />
                              )
                            )}
                          </div>
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-700">Color de Borde:</span>
                            <input
                              type="color"
                              value={currentDorsalStroke}
                              onChange={(e) => applyDorsalStyleChange({ strokeColor: e.target.value })}
                              className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                              title="Elegir color del borde de las letras y números"
                            />
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {['#000000', '#ffffff', '#1e3a8a', '#b91c1c', '#ca8a04', '#0f172a'].map(
                              (hex) => (
                                <button
                                  key={hex}
                                  type="button"
                                  onClick={() => applyDorsalStyleChange({ strokeColor: hex })}
                                  className={`w-5 h-5 rounded-full border cursor-pointer transition-transform ${
                                    currentDorsalStroke.toLowerCase() === hex
                                      ? 'ring-2 ring-violet-500 scale-110 border-white'
                                      : 'border-slate-300 hover:scale-105'
                                  }`}
                                  style={{ backgroundColor: hex }}
                                  title={`Borde ${hex}`}
                                />
                              )
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Botones de Grosor de Borde con Nombres Claros */}
                      <div className="space-y-1.5">
                        <span className="text-xs font-semibold text-slate-700 block">
                          Grosor del borde de letras y números:
                        </span>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                          {[
                            { label: 'Sin borde', widthMm: 0 },
                            { label: 'Borde Fino', widthMm: 1.5 },
                            { label: 'Borde Medio', widthMm: 2.5 },
                            { label: 'Borde Grueso', widthMm: 4.0 },
                            { label: 'Borde Extra', widthMm: 5.5 },
                          ].map((opt) => {
                            const isSelected = Math.abs(currentDorsalStrokeWidth - opt.widthMm) < 0.3;
                            return (
                              <button
                                key={opt.label}
                                type="button"
                                onClick={() => applyDorsalStyleChange({ strokeWidthMm: opt.widthMm })}
                                className={`px-2 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                                  isSelected
                                    ? 'bg-amber-400 text-slate-950 shadow-2xs'
                                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                                }`}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Sección compacta para subir/bajar el dibujo de fondo de la espalda */}
                      <div className="pt-2 border-t border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-700">
                            ⬆️ Subir / ⬇️ Bajar dibujo de fondo de espalda:
                          </span>
                          <span className="text-[11px] font-bold text-emerald-700">
                            {formatOffsetSummary(backOffsetMm, 'Original (0 cm)')}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              applyCalibrationChange({
                                backArtOffsetYMm: Math.max(-80, backOffsetMm - 5),
                              })
                            }
                            className="px-2 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer active:scale-95 shadow-2xs"
                          >
                            ⬆️ Subir (+5 mm)
                          </button>
                          <button
                            type="button"
                            onClick={() => applyCalibrationChange({ backArtOffsetYMm: 0 })}
                            className="px-2 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold cursor-pointer active:scale-95 shadow-2xs"
                          >
                            🔄 Original (0)
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              applyCalibrationChange({
                                backArtOffsetYMm: Math.min(40, backOffsetMm + 5),
                              })
                            }
                            className="px-2 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-amber-700 text-xs font-bold cursor-pointer active:scale-95 shadow-2xs"
                          >
                            ⬇️ Bajar (-5 mm)
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeZone === 'FRENTE' && (
                <div className="space-y-4">
                  <VisualArtworkOffsetControl
                    title="🛡️ Ajuste del Dibujo y Logos del Pecho / Frente"
                    explanation="Si al coser el dobladillo inferior se corta parte del diseño del frente, o si deseas acomodar la altura del arte del pecho, súbelo o bájalo aquí."
                    offsetMm={frontOffsetMm}
                    onChangeOffsetMm={(val) => applyCalibrationChange({ frontArtOffsetYMm: val })}
                  />

                  {/* Número opcional en el Pecho / Frente */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <Shield className="w-4 h-4 text-violet-600" />
                          <span>🔢 Número Pequeño en el Pecho (Opcional)</span>
                        </h4>
                        <p className="text-xs text-slate-500">
                          Actívalo si el diseño lleva el número del jugador también en la parte delantera.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          applyCalibrationChange({
                            includeFrontNumber: !generationConfig.includeFrontNumber,
                          })
                        }
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                          generationConfig.includeFrontNumber
                            ? 'bg-violet-600 text-white shadow-2xs'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {generationConfig.includeFrontNumber
                          ? '✓ Número en el Pecho: ACTIVADO'
                          : 'Activar Número en el Pecho'}
                      </button>
                    </div>

                    {generationConfig.includeFrontNumber && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
                        <div className="space-y-1.5">
                          <span className="text-xs font-semibold text-slate-700 block">
                            ¿En qué lado del pecho va?:
                          </span>
                          <div className="grid grid-cols-3 gap-1.5">
                            {[
                              { id: 'IZQUIERDA', label: '⬅️ Izquierda', x: 32 },
                              { id: 'CENTRO', label: '🎯 Centro', x: 50 },
                              { id: 'DERECHA', label: '➡️ Derecha', x: 68 },
                            ].map((pos) => (
                              <button
                                key={pos.id}
                                type="button"
                                onClick={() =>
                                  applyCalibrationChange({
                                    frontNumberPosition: pos.id as 'CENTRO' | 'DERECHA' | 'IZQUIERDA',
                                    frontNumberXPercent: pos.x,
                                  })
                                }
                                className={`px-2 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                                  (generationConfig.frontNumberPosition || 'CENTRO') === pos.id
                                    ? 'bg-violet-600 text-white shadow-2xs'
                                    : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                                }`}
                              >
                                {pos.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <span className="text-xs font-semibold text-slate-700 block">
                            Tamaño del número del pecho:
                          </span>
                          <div className="grid grid-cols-3 gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                applyCalibrationChange({
                                  frontNumberScale: Math.max(
                                    0.3,
                                    Number(((generationConfig.frontNumberScale ?? 1) - 0.1).toFixed(2))
                                  ),
                                })
                              }
                              className="px-2 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer shadow-2xs"
                            >
                              🔍− Más Pequeño
                            </button>
                            <button
                              type="button"
                              onClick={() => applyCalibrationChange({ frontNumberScale: 1 })}
                              className="px-2 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600 cursor-pointer shadow-2xs"
                            >
                              Normal (100%)
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                applyCalibrationChange({
                                  frontNumberScale: Math.min(
                                    2.5,
                                    Number(((generationConfig.frontNumberScale ?? 1) + 0.1).toFixed(2))
                                  ),
                                })
                              }
                              className="px-2 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold cursor-pointer shadow-2xs"
                            >
                              🔍+ Más Grande
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <span className="text-xs font-semibold text-slate-700 block">
                            Mover posición en el pecho:
                          </span>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                applyCalibrationChange({
                                  frontNumberYPercent: Math.max(
                                    15,
                                    (generationConfig.frontNumberYPercent ?? 38) - 2
                                  ),
                                })
                              }
                              className="px-2 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-emerald-700 cursor-pointer shadow-2xs"
                            >
                              ⬆️ Subir en el Pecho
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                applyCalibrationChange({
                                  frontNumberYPercent: Math.min(
                                    85,
                                    (generationConfig.frontNumberYPercent ?? 38) + 2
                                  ),
                                })
                              }
                              className="px-2 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-amber-700 cursor-pointer shadow-2xs"
                            >
                              ⬇️ Bajar en el Pecho
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeZone === 'PANTALONETA' && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-2xs">
                  {!orderHasShorts ? (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          🩳 Este pedido solo tiene Camisetas activas en este momento
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Cuando cargues un pedido con pantalonetas (o uniforme completo), aquí podrás elegir en qué pierna va el número y ajustar su tamaño y posición con un clic.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <VisualArtworkOffsetControl
                        title="🩳 Ajuste del Dibujo de Fondo de la Pantaloneta"
                        explanation="Si al coser la basta inferior de la pantaloneta se corta el diseño o las franjas, usa estos botones para subir el dibujo y dejar espacio libre abajo."
                        offsetMm={shortOffsetMm}
                        onChangeOffsetMm={(val) => applyCalibrationChange({ shortArtOffsetYMm: val })}
                      />
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">
                            🩳 Ajuste del Número en la Pantaloneta
                          </h4>
                          <p className="text-xs text-slate-500">
                            Elige si la pantaloneta lleva número, en qué pierna se estampa y acomoda su tamaño o altura.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            applyCalibrationChange({
                              includeShortNumber: generationConfig.includeShortNumber === false,
                            })
                          }
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                            generationConfig.includeShortNumber !== false
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {generationConfig.includeShortNumber !== false
                            ? '✓ Número en Pantaloneta: ACTIVADO'
                            : 'Activar Número en Pantaloneta'}
                        </button>
                      </div>

                      {generationConfig.includeShortNumber !== false && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Selección de pierna */}
                          <div className="space-y-2">
                            <span className="text-xs font-semibold text-slate-700 block">
                              1. ¿En qué pierna va el número?:
                            </span>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => applyCalibrationChange({ shortNumberPiece: 'IZQ' })}
                                className={`px-3 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                                  generationConfig.shortNumberPiece === 'IZQ'
                                    ? 'bg-violet-600 text-white shadow-2xs'
                                    : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                                }`}
                              >
                                🦵 Pierna Izquierda
                              </button>
                              <button
                                type="button"
                                onClick={() => applyCalibrationChange({ shortNumberPiece: 'DER' })}
                                className={`px-3 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                                  (generationConfig.shortNumberPiece || 'DER') === 'DER'
                                    ? 'bg-violet-600 text-white shadow-2xs'
                                    : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                                }`}
                              >
                                🦵 Pierna Derecha
                              </button>
                            </div>
                          </div>

                          {/* Tamaño del número */}
                          <div className="space-y-2">
                            <span className="text-xs font-semibold text-slate-700 block">
                              2. Tamaño del número ({Math.round((generationConfig.shortNumberScale ?? 1) * 100)}%):
                            </span>
                            <div className="grid grid-cols-3 gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  applyCalibrationChange({
                                    shortNumberScale: Math.max(
                                      0.4,
                                      Number(((generationConfig.shortNumberScale ?? 1) - 0.1).toFixed(2))
                                    ),
                                  })
                                }
                                className="px-2.5 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer shadow-2xs"
                              >
                                🔍− Más Pequeño
                              </button>
                              <button
                                type="button"
                                onClick={() => applyCalibrationChange({ shortNumberScale: 1 })}
                                className="px-2.5 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600 cursor-pointer shadow-2xs"
                              >
                                Normal (100%)
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  applyCalibrationChange({
                                    shortNumberScale: Math.min(
                                      2.5,
                                      Number(((generationConfig.shortNumberScale ?? 1) + 0.1).toFixed(2))
                                    ),
                                  })
                                }
                                className="px-2.5 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold cursor-pointer shadow-2xs"
                              >
                                🔍+ Más Grande
                              </button>
                            </div>
                          </div>

                          {/* Posición del número en la pantaloneta */}
                          <div className="space-y-2">
                            <span className="text-xs font-semibold text-slate-700 block">
                              3. Mover posición del número:
                            </span>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  applyCalibrationChange({
                                    shortNumberYPercent: Math.max(
                                      15,
                                      (generationConfig.shortNumberYPercent ?? 45) - 3
                                    ),
                                  })
                                }
                                className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-emerald-700 cursor-pointer shadow-2xs"
                              >
                                ⬆️ Subir Número
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  applyCalibrationChange({
                                    shortNumberYPercent: Math.min(
                                      85,
                                      (generationConfig.shortNumberYPercent ?? 45) + 3
                                    ),
                                  })
                                }
                                className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-amber-700 cursor-pointer shadow-2xs"
                              >
                                ⬇️ Bajar Número
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  applyCalibrationChange({
                                    shortNumberXPercent: Math.max(
                                      10,
                                      (generationConfig.shortNumberXPercent ?? 50) - 3
                                    ),
                                  })
                                }
                                className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer shadow-2xs"
                              >
                                ⬅️ Hacia la Izquierda
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  applyCalibrationChange({
                                    shortNumberXPercent: Math.min(
                                      90,
                                      (generationConfig.shortNumberXPercent ?? 50) + 3
                                    ),
                                  })
                                }
                                className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer shadow-2xs"
                              >
                                ➡️ Hacia la Derecha
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* GRILLA INFERIOR DE PIEZAS DE LA PRENDA CON CONEXIÓN VISUAL DINÁMICA */}
          {sortedPieces.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[380px] p-8 text-center bg-white border border-slate-200 rounded-xl shadow-2xs">
              <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mb-4 shadow-2xs">
                {currentPlayer.pieces.some(
                  (p) => p.pieceType.startsWith('SHORT') || p.pieceType.startsWith('PANTALONETA')
                ) ? (
                  <Scissors className="w-8 h-8 text-violet-600" />
                ) : (
                  <Shirt className="w-8 h-8 text-violet-600" />
                )}
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2 font-mono">
                {currentPlayer.playerName} (#{currentPlayer.playerNumber}) no tiene piezas de{' '}
                {garmentTypeFilter === 'CAMISETA' ? 'Camiseta' : 'Short'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mb-6 leading-relaxed">
                En el archivo Excel, este jugador está registrado con pedido de{' '}
                <span className="text-amber-700 font-bold uppercase font-mono">
                  {currentPlayer.pieces.some(
                    (p) => p.pieceType.startsWith('SHORT') || p.pieceType.startsWith('PANTALONETA')
                  )
                    ? 'Solo Short'
                    : 'Solo Camiseta'}
                </span>
                . Tu filtro superior está en "{garmentTypeFilter === 'CAMISETA' ? 'Camisetas' : 'Shorts'}".
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setGarmentTypeFilter(garmentTypeFilter === 'CAMISETA' ? 'SHORT' : 'CAMISETA')
                  }
                  className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  {garmentTypeFilter === 'CAMISETA' ? (
                    <>
                      <Scissors className="w-3.5 h-3.5" />
                      <span>Ver Shorts de este jugador</span>
                    </>
                  ) : (
                    <>
                      <Shirt className="w-3.5 h-3.5" />
                      <span>Ver Camiseta de este jugador</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setGarmentTypeFilter('ALL')}
                  className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-all cursor-pointer flex items-center gap-2 shadow-2xs"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Ver Todo el Pedido</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {sortedPieces.map((piece) => {
                const pieceZone = getPieceZone(piece.pieceType);
                const isHighlighted = showCalibrationPanel && activeZone === pieceZone;
                const dimensionsLabel = `${formatWithUnits(piece.bbox.width)} × ${formatWithUnits(
                  piece.bbox.height
                )}`;

                return (
                  <InspectionPieceCard
                    key={piece.id}
                    piece={piece}
                    pieceSvg={resolvePieceSvg(piece)}
                    isHighlighted={isHighlighted}
                    isTechnicalGrid={isTechnicalGrid}
                    showGuides={showGuides}
                    hemMarginMm={hemMarginMm}
                    dimensionsLabel={dimensionsLabel}
                    hemLabel={hemLabel}
                    onSelectZone={handleSelectZoneFromCard}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
