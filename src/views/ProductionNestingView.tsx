import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { 
  Play, 
  Lock, 
  Download, 
  Sparkles, 
  Trash2, 
  Eye, 
  Printer, 
  ZoomIn, 
  ZoomOut, 
  AlertTriangle,
  Layers,
  Scissors,
  Shirt,
  Sliders,
  FileCheck,
  Loader2,
  RotateCw,
  Settings2,
  Wrench,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { useProfileStore } from '@/modules/settings/profileStore';
import { useGeneratorStore } from '@/modules/generator/generatorStore';
import { resolvePieceSvg } from '@/modules/generator/garmentGenerator';
import { useNestingStore } from '@/core/nesting/nestingStore';
import { useInteractiveCanvas } from '@/modules/canvas/useInteractiveCanvas';
import { NestingPieceInput, NestingSheet, PlacedNestingPiece } from '@/core/nesting/types';
import { ExportModal } from '@/modules/export/ExportModal';
import { GarmentInspectionTab } from './GarmentInspectionTab';
import { showAlert } from '@/core/ui/alerts';
import { useUnits } from '@/core/units/useUnits';
import { useNavigationStore } from '@/modules/navigation/navigationStore';

interface CanvasPieceItemProps {
  piece: PlacedNestingPiece;
  mmToPx: number;
  isSelected: boolean;
  isCurrentlyDragged: boolean;
  dragX?: number;
  dragY?: number;
  isLightweight: boolean;
  showBorders: boolean;
  onPieceMouseDown: (e: React.MouseEvent, pieceId: string, initialX: number, initialY: number) => void;
  onSelectPiece: (pieceId: string) => void;
}

const CanvasPieceItem = React.memo<CanvasPieceItemProps>(({
  piece,
  mmToPx,
  isSelected,
  isCurrentlyDragged,
  dragX,
  dragY,
  isLightweight,
  showBorders,
  onPieceMouseDown,
  onSelectPiece,
}) => {
  const { format: formatWithUnits } = useUnits();
  const currentX = isCurrentlyDragged && dragX !== undefined ? dragX : piece.xMm;
  const currentY = isCurrentlyDragged && dragY !== undefined ? dragY : piece.yMm;

  const posX = currentX * mmToPx;
  const posY = (currentY * mmToPx) + 28;
  const widthPx = piece.effectiveWidthMm * mmToPx;
  const heightPx = piece.effectiveHeightMm * mmToPx;

  const svgInnerHtml = useMemo(
    () => (isLightweight ? null : { __html: resolvePieceSvg(piece) }),
    [piece, isLightweight]
  );

  return (
    <div
      data-piece="true"
      onMouseDown={(e) => onPieceMouseDown(e, piece.id, piece.xMm, piece.yMm)}
      onClick={() => onSelectPiece(piece.id)}
      className={`absolute transition-all group select-none ${
        isCurrentlyDragged
          ? 'cursor-grabbing drop-shadow-[0_0_12px_rgba(34,211,238,0.85)] z-50 opacity-95 scale-[1.01]'
          : isSelected
          ? 'drop-shadow-[0_0_10px_rgba(56,189,248,0.85)] z-30 cursor-grab'
          : showBorders
          ? 'hover:drop-shadow-[0_0_6px_rgba(148,163,184,0.6)] z-10 cursor-grab'
          : 'z-10 cursor-grab'
      }`}
      style={{
        left: `${posX}px`,
        top: `${posY}px`,
        width: `${widthPx}px`,
        height: `${heightPx}px`,
      }}
    >
      {isLightweight || !svgInnerHtml ? (
        <div className="w-full h-full flex flex-col items-center justify-center p-1.5 bg-white/95 text-center pointer-events-none border border-dashed border-violet-400">
          <span className="text-[10px] font-bold font-mono text-slate-800 truncate max-w-full">
            {piece.playerName} #{piece.playerNumber}
          </span>
          <span className="text-[9px] font-mono text-violet-700 truncate max-w-full">
            {piece.pieceType} • T{piece.sizeName}
          </span>
        </div>
      ) : (
        <svg
          viewBox={`0 0 ${piece.effectiveWidthMm} ${piece.effectiveHeightMm}`}
          className="w-full h-full pointer-events-none"
          preserveAspectRatio="xMidYMid meet"
        >
          <g
            transform={
              piece.rotationDeg === 90
                ? `translate(${piece.effectiveWidthMm}, 0) rotate(90)`
                : piece.rotationDeg === 270
                ? `translate(0, ${piece.effectiveHeightMm}) rotate(270)`
                : piece.rotationDeg === 180
                ? `translate(${piece.effectiveWidthMm}, ${piece.effectiveHeightMm}) rotate(180)`
                : undefined
            }
          >
            <g dangerouslySetInnerHTML={svgInnerHtml} />
          </g>
        </svg>
      )}

      {/* Overlay informativo de pieza al pasar el cursor */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 text-[10px] font-mono text-white pointer-events-none">
        <div className="flex items-center justify-between">
          <span className="font-bold text-amber-400">{piece.playerName}</span>
          <span className="text-purple-300">#{piece.playerNumber} • T{piece.sizeName}</span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>{piece.pieceType}</span>
          <span>{formatWithUnits(piece.effectiveWidthMm)} × {formatWithUnits(piece.effectiveHeightMm)}</span>
        </div>
      </div>
    </div>
  );
});

function summarizeProductionWarnings(warnings: string[]): string[] {
  const shortArtworkPlayers = new Set<string>();
  const missingShortSides = new Set<string>();
  const missingSizes = new Map<string, Set<string>>();
  const otherWarnings: string[] = [];

  for (const warning of warnings) {
    const playerMatch = warning.match(/^Jugador\s+(.+?)(?:,\s*talla\s+[^:]+)?:\s+(.+)$/i);
    const playerName = playerMatch?.[1]?.trim();
    const reason = playerMatch?.[2] || warning;

    if (playerName && /diseño de la pierna/i.test(reason)) {
      shortArtworkPlayers.add(playerName);
      if (/pierna izquierda/i.test(reason)) missingShortSides.add('izquierda');
      if (/pierna derecha/i.test(reason)) missingShortSides.add('derecha');
      continue;
    }

    const sizeMatch = reason.match(/la talla\s+["“]([^"”]+)["”]\s+no existe/i);
    if (playerName && sizeMatch) {
      const size = sizeMatch[1];
      if (!missingSizes.has(size)) missingSizes.set(size, new Set());
      missingSizes.get(size)!.add(playerName);
      continue;
    }

    otherWarnings.push(warning);
  }

  const summaries: string[] = [];
  if (shortArtworkPlayers.size > 0) {
    const sides = Array.from(missingShortSides);
    summaries.push(
      `${shortArtworkPlayers.size} ${shortArtworkPlayers.size === 1 ? 'jugador omitido' : 'jugadores omitidos'}: `
      + `faltan diseños de pantaloneta${sides.length ? ` (${sides.join(' y ')})` : ''}.`
    );
  }
  if (missingSizes.size > 0) {
    const totalPlayers = Array.from(missingSizes.values()).reduce((total, names) => total + names.size, 0);
    const sizes = Array.from(missingSizes.keys()).join(', ');
    summaries.push(
      `${totalPlayers} ${totalPlayers === 1 ? 'jugador omitido' : 'jugadores omitidos'}: `
      + `${missingSizes.size === 1 ? 'la talla' : 'las tallas'} ${sizes} no ${missingSizes.size === 1 ? 'existe' : 'existen'} en el molde.`
    );
  }
  if (otherWarnings.length > 0) {
    summaries.push(`${otherWarnings.length} ${otherWarnings.length === 1 ? 'incidencia adicional' : 'incidencias adicionales'}.`);
  }
  return summaries;
}

export const ProductionNestingView: React.FC = () => {
  const { format: formatWithUnits } = useUnits();
  const isPreviewMode = useNavigationStore((state) => state.isNestingPreviewMode);
  const setPreviewMode = useNavigationStore((state) => state.setNestingPreviewMode);
  const { activeProfile } = useProfileStore();
  const { generatedPieces, generationResult, setProductionScope } = useGeneratorStore();
  const { 
    placedPieces, 
    sheets,
    activeSheetIndex,
    setActiveSheetIndex,
    nestingResult, 
    isNesting, 
    nestingProgress,
    nestingMode, 
    setNestingMode,
    spacingMm,
    setSpacingMm,
    printableWidthMm,
    setPrintableWidthMm,
    maxSheetLengthMm,
    setMaxSheetLengthMm,
    runNesting, 
    reoptimizeUnlocked,
    clearNesting,
    selectedPieceId,
    setSelectedPieceId,
    rotatePiece,
    toggleLockPiece
  } = useNestingStore();

  const {
    zoomLevel,
    setZoomLevel,
    pan,
    isPanning,
    dragState,
    mmToPx,
    handlePieceMouseDown,
    handleCanvasMouseDown,
    handleWheel,
    fitToWidth,
    fitToAll,
  } = useInteractiveCanvas();

  const [activeTab, setActiveTab] = useState<'INSPECTION' | 'ROLL'>('INSPECTION');
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [viewAllSheets, setViewAllSheets] = useState<boolean>(false);
  const [showPieceBorders, setShowPieceBorders] = useState<boolean>(true);

  // Mapear piezas generadas al formato de entrada del motor de nesting
  const nestingPieceInputs: NestingPieceInput[] = useMemo(() => {
    return generatedPieces.map((gp) => ({
      id: gp.id,
      orderItemId: gp.orderItemId,
      pieceId: gp.pieceId,
      playerName: gp.playerName,
      playerNumber: gp.playerNumber,
      sizeName: gp.sizeName,
      pieceType: gp.pieceType,
      bbox: {
        width: gp.bbox.width,
        height: gp.bbox.height,
      },
      areaMm2: gp.areaMm2,
      allowedRotations: gp.allowedRotationsDeg,
      cutPolygon: gp.cutPolygon,
    }));
  }, [generatedPieces]);

  // Ejecutar entallado en rollo
  const handleRunNesting = async (overrideInputs?: NestingPieceInput[] | unknown) => {
    const inputsToNest = Array.isArray(overrideInputs) ? overrideInputs : nestingPieceInputs;
    if (inputsToNest.length === 0) return;
    const res = await runNesting(inputsToNest, {
      printableWidthMm,
      maxSheetLengthMm,
      spacingMm,
      groupingMode: nestingMode,
    });
    const utilization = res?.utilizationPercent ?? 0;
    showAlert.toast(
      'success',
      `✅ Acomodo Inteligente completado: ${utilization.toFixed(1)}% de aprovechamiento`
    );
  };

  // Actualizar separación entre piezas y reacomodar rollo automáticamente
  const handleSpacingChange = async (rawSpacingMm: number) => {
    if (!Number.isFinite(rawSpacingMm)) return;
    const clampedSpacingMm = Math.max(0, Math.min(30, rawSpacingMm));
    setSpacingMm(clampedSpacingMm);
    if (nestingPieceInputs.length > 0 && !isNesting) {
      const res = await runNesting(nestingPieceInputs, {
        printableWidthMm,
        maxSheetLengthMm,
        spacingMm: clampedSpacingMm,
        groupingMode: nestingMode,
      });
      const utilization = res?.utilizationPercent ?? 0;
      showAlert.toast(
        'success',
        `✅ Acomodo Inteligente completado: ${utilization.toFixed(1)}% de aprovechamiento`
      );
    }
  };

  // Reoptimizar piezas no bloqueadas
  const handleReoptimize = async () => {
    if (nestingPieceInputs.length === 0) return;
    const res = await reoptimizeUnlocked(nestingPieceInputs);
    const utilization = res?.utilizationPercent ?? 0;
    showAlert.toast(
      'success',
      `✅ Acomodo Inteligente completado: ${utilization.toFixed(1)}% de aprovechamiento`
    );
  };

  // Pliego activo
  const activeSheet: NestingSheet | undefined = sheets[activeSheetIndex] || sheets[0];

  // Piezas a renderizar (del pliego activo o de todos si está en vista general)
  const currentDisplayedPieces = useMemo(() => {
    if (viewAllSheets || !activeSheet) return placedPieces;
    return activeSheet.placedPieces;
  }, [placedPieces, activeSheet, viewAllSheets]);

  const selectedPiece = useMemo(
    () => placedPieces.find((piece) => piece.id === selectedPieceId),
    [placedPieces, selectedPieceId]
  );
  const canRotateSelectedPiece = Boolean(
    selectedPiece
      && (selectedPiece.pieceType.toUpperCase().startsWith('MANGA')
        || selectedPiece.allowedRotations.some((rotation) => rotation !== selectedPiece.rotationDeg))
  );

  // Dimensiones del lienzo según el pliego activo
  const currentCanvasHeightMm = useMemo(() => {
    if (viewAllSheets || !activeSheet) {
      return nestingResult?.totalRollLengthMm || 1000;
    }
    return activeSheet.heightMm;
  }, [viewAllSheets, activeSheet, nestingResult]);

  const canvasWidthPx = printableWidthMm * mmToPx;
  const canvasHeightPx = Math.max(1000, (currentCanvasHeightMm + 150) * mmToPx);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [viewportSize, setViewportSize] = useState<{ width: number; height: number }>(() => ({
    width: typeof window !== 'undefined' && window.innerWidth > 0 ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' && window.innerHeight > 0 ? window.innerHeight : 900,
  }));

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const updateSize = () => {
      if (!viewportRef.current) return;
      const w = viewportRef.current.clientWidth;
      const h = viewportRef.current.clientHeight;
      if (w > 0 && h > 0) {
        setViewportSize((prev) => (prev.width === w && prev.height === h ? prev : { width: w, height: h }));
      }
    };

    updateSize();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(updateSize);
      observer.observe(el);
      return () => observer.disconnect();
    }
  }, [activeTab]);

  const handleSelectPiece = useCallback(
    (pieceId: string) => {
      setSelectedPieceId(pieceId);
    },
    [setSelectedPieceId]
  );

  // Viewport Culling: filtrar piezas fuera del área visible del contenedor (+ margen de overscan)
  const visiblePieces = useMemo(() => {
    const OVERSCAN_PX = 800;
    const vw = viewportSize.width > 0 ? viewportSize.width : 1280;
    const vh = viewportSize.height > 0 ? viewportSize.height : 900;
    const rollLeftPx = (vw - canvasWidthPx) / 2 + pan.x;
    const rollTopPx = 32 + pan.y;

    return currentDisplayedPieces.filter((piece) => {
      if (piece.id === dragState.pieceId || piece.id === selectedPieceId) {
        return true;
      }
      const pieceLeft = rollLeftPx + piece.xMm * mmToPx;
      const pieceRight = pieceLeft + piece.effectiveWidthMm * mmToPx;
      const pieceTop = rollTopPx + piece.yMm * mmToPx + 28;
      const pieceBottom = pieceTop + piece.effectiveHeightMm * mmToPx;

      return (
        pieceBottom >= -OVERSCAN_PX &&
        pieceTop <= vh + OVERSCAN_PX &&
        pieceRight >= -OVERSCAN_PX &&
        pieceLeft <= vw + OVERSCAN_PX
      );
    });
  }, [
    currentDisplayedPieces,
    viewportSize.width,
    viewportSize.height,
    canvasWidthPx,
    pan.x,
    pan.y,
    mmToPx,
    dragState.pieceId,
    selectedPieceId,
  ]);

  // Modo ligero automático cuando el zoom es muy lejano o hay alta densidad de piezas simultáneas en pantalla
  const isFarZoomLightweight = zoomLevel < 28 || visiblePieces.length > 48;

  // Métricas
  const totalPieces = generatedPieces.length;
  const placedCount = placedPieces.length;
  const lockedCount = placedPieces.filter((p) => p.isLocked).length;
  const totalGarments = generationResult?.totalGarments || 0;
  const actualLengthM = ((currentCanvasHeightMm) / 1000.0).toFixed(2);
  const efficiency = activeSheet ? activeSheet.utilizationPercent.toFixed(1) : (nestingResult ? nestingResult.utilizationPercent.toFixed(1) : '0.0');
  const warningSummaries = useMemo(
    () => summarizeProductionWarnings(generationResult?.warnings || []),
    [generationResult?.warnings]
  );

  return (
    <div className={`flex flex-col bg-slate-100 overflow-hidden select-none ${isPreviewMode ? 'h-screen' : 'h-[calc(100vh-4rem)]'}`}>
      {!isPreviewMode && generationResult && generationResult.warnings.length > 0 && (
        <div className="flex-shrink-0 border-b border-amber-200 bg-amber-50 px-6 py-2 text-xs text-amber-900">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-none text-amber-600" />
            <div className="min-w-0 flex-1">
              <div>
                <strong className="text-amber-800">Producción incompleta:</strong>{' '}
                {warningSummaries.join(' ')}
              </div>
              <details className="mt-1">
                <summary className="w-fit cursor-pointer font-semibold text-amber-700 hover:underline">
                  Ver detalle ({generationResult.warnings.length})
                </summary>
                <ul className="mt-1.5 max-h-28 list-disc space-y-1 overflow-y-auto pl-5 text-[11px] text-amber-800">
                  {generationResult.warnings.map((warning, index) => (
                    <li key={`${index}_${warning}`}>{warning}</li>
                  ))}
                </ul>
              </details>
            </div>
          </div>
        </div>
      )}

      {/* Barra de Navegación Principal del Flujo de Producción */}
      {!isPreviewMode && <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center justify-between flex-shrink-0 z-30 shadow-xs">
        {/* Selector de Pestañas: 1. Revisión vs 2. Rollo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-1 text-xs">
            <button
              onClick={() => setActiveTab('INSPECTION')}
              className={`px-3.5 py-1.5 rounded-md font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'INSPECTION'
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>1. Revisión de Entallado ({totalGarments} uniformes)</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('ROLL');
                if (nestingPieceInputs.length > 0 && placedPieces.length === 0 && !isNesting) {
                  handleRunNesting();
                }
              }}
              className={`px-3.5 py-1.5 rounded-md font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'ROLL'
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>2. Rollo de Sublimación ({formatWithUnits(printableWidthMm)})</span>
            </button>
          </div>
        </div>

        {/* Acciones del Extremo Derecho (Solo cuando se visualiza el Rollo) */}
        {activeTab === 'ROLL' && (
          <div className="flex items-center gap-3">
            {/* Controles de Zoom del Rollo */}
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 text-xs text-slate-600 shadow-xs">
              <button
                onClick={() => setZoomLevel((z) => Math.max(z - 10, 15))}
                className="p-1 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer"
                title="Reducir zoom"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-mono text-[11px] text-slate-700 min-w-[42px] text-center font-medium">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(z + 10, 300))}
                className="p-1 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer"
                title="Aumentar zoom"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  const w = typeof window !== 'undefined' ? window.innerWidth : 1100;
                  fitToWidth(w - 80);
                }}
                className="px-2 py-0.5 hover:text-violet-700 hover:bg-violet-50 rounded font-mono text-[10px] text-violet-600 font-semibold cursor-pointer"
                title="Ajustar ancho del rollo a la pantalla para ver prendas grandes"
              >
                Ajustar Ancho
              </button>
              <button
                onClick={() => {
                  const h = typeof window !== 'undefined' ? window.innerHeight : 800;
                  fitToAll(h - 160, currentCanvasHeightMm);
                }}
                className="px-2 py-0.5 hover:text-sky-700 hover:bg-sky-50 rounded font-mono text-[10px] text-sky-600 font-semibold cursor-pointer"
                title="Ver todo el largo del rollo"
              >
                Ver Todo
              </button>
              <button
                onClick={() => setShowPieceBorders(v => !v)}
                className={`px-2 py-0.5 hover:bg-slate-100 rounded font-mono text-[10px] cursor-pointer transition-colors ${showPieceBorders ? 'text-slate-600' : 'text-emerald-700 bg-emerald-50 font-bold'}`}
                title={showPieceBorders ? 'Ocultar contornos de piezas' : 'Mostrar contornos de piezas'}
              >
                {showPieceBorders ? 'Ocultar Contornos' : 'Mostrar Contornos'}
              </button>
            </div>

            <button 
              disabled={placedCount === 0 || isNesting}
              onClick={() => setIsExportModalOpen(true)}
              title={
                placedCount === 0
                  ? 'Desactivado: No hay piezas acomodadas en el rollo para exportar. Haz clic en "⚡ Acomodar Inteligente" primero.'
                  : isNesting
                  ? 'Desactivado: Espera a que finalice el cálculo del acomodo inteligente.'
                  : 'Exportar pliegos en escala real 1:1 listos para plotter de sublimación (PDF / SVG)'
              }
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition-all ${
                placedCount === 0 || isNesting
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 opacity-60 cursor-not-allowed shadow-none'
                  : 'bg-violet-600 hover:bg-violet-700 text-white cursor-pointer active:scale-95'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>🖨️ Exportar Nesting</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition-colors cursor-pointer active:scale-95"
              title="Ocultar menús y ampliar el rollo"
            >
              <Maximize2 className="h-3.5 w-3.5 text-slate-500" />
              <span>Vista previa</span>
            </button>
          </div>
        )}
      </div>}

      {/* CONTENIDO SEGÚN LA PESTAÑA ACTIVA */}
      {activeTab === 'INSPECTION' ? (
        <GarmentInspectionTab
          generatedPieces={generatedPieces}
          totalGarments={totalGarments}
          onProceedToRoll={(scope) => {
            let currentPieces = generatedPieces;
            if (scope) {
              const res = setProductionScope(scope);
              if (res && res.pieces.length > 0) {
                currentPieces = res.pieces;
              }
            }
            setActiveTab('ROLL');
            const inputs: NestingPieceInput[] = currentPieces.map((gp) => ({
              id: gp.id,
              orderItemId: gp.orderItemId,
              pieceId: gp.pieceId,
              playerName: gp.playerName,
              playerNumber: gp.playerNumber,
              sizeName: gp.sizeName,
              pieceType: gp.pieceType,
              bbox: {
                width: gp.bbox.width,
                height: gp.bbox.height,
              },
              areaMm2: gp.areaMm2,
              allowedRotations: gp.allowedRotationsDeg,
              cutPolygon: gp.cutPolygon,
            }));
            if (inputs.length > 0 && !isNesting) {
              handleRunNesting(inputs);
            }
          }}
        />
      ) : (
        /* PESTAÑA 2: ROLLO DE SUBLIMACIÓN (NESTING MODULAR MULTI-ARCHIVO) */
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {isPreviewMode && (
            <div className="z-30 flex flex-shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-3 py-1.5 text-xs shadow-xs backdrop-blur">
              <div className="flex min-w-0 items-center gap-3 font-mono">
                <strong className="truncate text-slate-800">Rollo de sublimación</strong>
                <span className="text-sky-700 font-bold">{actualLengthM} m</span>
                <span className="text-violet-700 font-bold">{efficiency}%</span>
                {placedCount > 0 && <span className="h-2 w-2 rounded-full bg-emerald-500" title="Acomodo activo" />}
              </div>

              <div className="flex items-center gap-1.5">
                {selectedPiece && (
                  <>
                    <button
                      type="button"
                      disabled={!canRotateSelectedPiece || isNesting}
                      onClick={() => {
                        if (selectedPieceId && !rotatePiece(selectedPieceId, 90)) {
                          showAlert.toast('warning', 'No se puede rotar aquí: mueve la pieza a un espacio libre');
                        }
                      }}
                      className="flex items-center gap-1 rounded-md border border-sky-300 bg-sky-50 px-2 py-1 text-sky-700 disabled:opacity-40"
                      title="Rotar pieza seleccionada 90°"
                    >
                      <RotateCw className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Rotar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleLockPiece(selectedPiece.id)}
                      className={`flex items-center gap-1 rounded-md border px-2 py-1 ${selectedPiece.isLocked ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-slate-200 bg-white text-slate-700'}`}
                      title={selectedPiece.isLocked ? 'Desbloquear pieza' : 'Bloquear pieza'}
                    >
                      <Lock className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{selectedPiece.isLocked ? 'Fija' : 'Fijar'}</span>
                    </button>
                  </>
                )}

                <div className="flex items-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-xs">
                  <button onClick={() => setZoomLevel((z) => Math.max(z - 10, 15))} className="p-1.5 hover:bg-slate-100" title="Reducir zoom"><ZoomOut className="h-3.5 w-3.5" /></button>
                  <span className="min-w-10 text-center font-mono text-[10px] font-medium">{zoomLevel}%</span>
                  <button onClick={() => setZoomLevel((z) => Math.min(z + 10, 300))} className="p-1.5 hover:bg-slate-100" title="Aumentar zoom"><ZoomIn className="h-3.5 w-3.5" /></button>
                  <button onClick={() => fitToWidth((typeof window !== 'undefined' ? window.innerWidth : 1100) - 48)} className="border-l border-slate-200 px-2 py-1 font-mono text-[10px] text-violet-700 font-semibold">Ancho</button>
                  <button onClick={() => fitToAll((typeof window !== 'undefined' ? window.innerHeight : 800) - 90, currentCanvasHeightMm)} className="border-l border-slate-200 px-2 py-1 font-mono text-[10px] text-sky-700 font-semibold">Todo</button>
                </div>

                <button
                  type="button"
                  disabled={placedCount === 0 || isNesting}
                  onClick={() => setIsExportModalOpen(true)}
                  className="flex items-center gap-1 rounded-md bg-violet-600 px-2.5 py-1.5 font-bold text-white shadow-xs disabled:opacity-40"
                  title="Exportar producción 1:1"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Exportar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode(false)}
                  className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 font-bold text-slate-700 shadow-xs hover:bg-slate-50"
                  title="Salir de vista previa"
                >
                  <Minimize2 className="h-3.5 w-3.5" />
                  <span>Salir</span>
                </button>
              </div>
            </div>
          )}

          {/* Cinta superior de configuración de Bobina y Pliego */}
          {!isPreviewMode && <div className="bg-slate-50/95 border-b border-slate-200 px-6 py-2 flex flex-wrap items-center justify-between gap-4 z-20 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <details className="group relative">
                <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-700 shadow-xs hover:border-violet-500">
                  <Settings2 className="h-3.5 w-3.5 text-violet-600" />
                  <span>Configuración</span>
                  <span className="font-mono text-[10px] text-slate-500">{printableWidthMm} mm · {spacingMm} mm</span>
                </summary>
                <div className="absolute left-0 top-full z-50 mt-2 flex min-w-max flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
              {/* 1. Selector de Ancho de Bobina */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
                <span className="text-[10px] text-slate-500 uppercase font-mono font-bold">Bobina:</span>
                <select
                  value={printableWidthMm}
                  disabled={isNesting}
                  onChange={async (e) => {
                    const newW = Number(e.target.value);
                    setPrintableWidthMm(newW);
                    if (nestingPieceInputs.length > 0) {
                      const res = await runNesting(nestingPieceInputs, { printableWidthMm: newW, maxSheetLengthMm, spacingMm });
                      showAlert.toast('success', `✅ Acomodo Inteligente completado: ${(res?.utilizationPercent ?? 0).toFixed(1)}% de aprovechamiento`);
                    }
                  }}
                  className="bg-transparent text-violet-700 font-bold font-mono focus:outline-none cursor-pointer"
                >
                  <option value={1120} className="bg-white text-slate-800">1120 mm (1.12 m)</option>
                  <option value={1600} className="bg-white text-slate-800">1600 mm (1.60 m)</option>
                  <option value={1800} className="bg-white text-slate-800">1800 mm (1.80 m)</option>
                  <option value={1900} className="bg-white text-slate-800">1900 mm (1.90 m)</option>
                </select>
              </div>

              {/* 2. Selector de Largo Máximo de Pliego / Archivo */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
                <span className="text-[10px] text-slate-500 uppercase font-mono font-bold">Máx. Pliego:</span>
                <select
                  value={maxSheetLengthMm}
                  disabled={isNesting}
                  onChange={async (e) => {
                    const newH = Number(e.target.value);
                    setMaxSheetLengthMm(newH);
                    if (nestingPieceInputs.length > 0) {
                      const res = await runNesting(nestingPieceInputs, { printableWidthMm, maxSheetLengthMm: newH, spacingMm });
                      showAlert.toast('success', `✅ Acomodo Inteligente completado: ${(res?.utilizationPercent ?? 0).toFixed(1)}% de aprovechamiento`);
                    }
                  }}
                  className="bg-transparent text-sky-700 font-bold font-mono focus:outline-none cursor-pointer"
                >
                  <option value={2000} className="bg-white text-slate-800">200 cm (2.0 m)</option>
                  <option value={2500} className="bg-white text-slate-800">250 cm (2.5 m)</option>
                  <option value={3000} className="bg-white text-slate-800">300 cm (3.0 m)</option>
                  <option value={4000} className="bg-white text-slate-800">400 cm (4.0 m)</option>
                  <option value={5000} className="bg-white text-slate-800">500 cm (5.0 m - Máx. estándar)</option>
                </select>
              </div>

              {/* 3. Control Dinámico y Claro de Separación entre Piezas */}
              <div
                className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs"
                title="Separación libre en milímetros entre piezas de corte en el rollo"
              >
                <span className="text-[10px] text-slate-500 uppercase font-mono font-bold">Separación:</span>
                <div className="flex items-center gap-1">
                  {[2, 3, 5, 6].map((preset) => {
                    const isActive = spacingMm === preset;
                    return (
                      <button
                        key={preset}
                        type="button"
                        disabled={isNesting}
                        onClick={() => handleSpacingChange(preset)}
                        className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold transition-all cursor-pointer disabled:opacity-50 ${
                          isActive
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:text-emerald-700 border border-slate-200'
                        }`}
                        title={`Aplicar separación rápida de ${preset} mm`}
                      >
                        {preset} mm
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-1 ml-1 pl-1.5 border-l border-slate-200">
                  <input
                    type="number"
                    min={0}
                    max={30}
                    step={0.5}
                    value={spacingMm}
                    disabled={isNesting}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!Number.isNaN(val)) {
                        handleSpacingChange(val);
                      }
                    }}
                    className="w-14 bg-white border border-slate-300 focus:border-emerald-500 rounded px-1.5 py-0.5 text-center text-emerald-700 font-bold font-mono text-[11px] focus:outline-none disabled:opacity-50"
                    title="Escribe cualquier separación personalizada entre 0 mm y 30 mm"
                  />
                  <span className="text-[10px] font-mono text-slate-500">mm</span>
                </div>
              </div>
                </div>
              </details>

              {/* Botón Principal: ⚡ Acomodar Inteligente */}
              <button 
                onClick={() => handleRunNesting()}
                disabled={totalPieces === 0 || isNesting}
                title={
                  totalPieces === 0
                    ? 'No hay piezas generadas para acomodar'
                    : isNesting
                    ? 'Calculando acomodo inteligente en curso...'
                    : 'Calcular y ejecutar acomodo inteligente en la bobina'
                }
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition-all ${
                  totalPieces === 0 || isNesting
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none'
                    : 'bg-violet-600 hover:bg-violet-700 text-white cursor-pointer active:scale-95'
                }`}
              >
                {isNesting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                    <span>{`⏳ Calculando acomodo inteligente (${nestingProgress}%)...`}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>⚡ Acomodar Inteligente</span>
                  </>
                )}
              </button>

              {/* Indicador Visual de Estado de Acomodo Inteligente Activo */}
              {placedCount > 0 && !isNesting && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-700 text-[11px] font-mono font-semibold" title="Acomodo inteligente activo">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Activo</span>
                </div>
              )}

              {selectedPiece && (
                <div className="flex items-center gap-1 rounded-lg border border-sky-300 bg-sky-50 p-0.5">
                  <span className="max-w-28 truncate px-1.5 text-[10px] text-sky-800 font-semibold">{selectedPiece.pieceType}</span>
                  <button
                    type="button"
                    disabled={!canRotateSelectedPiece || isNesting}
                    onClick={() => {
                      if (selectedPieceId && !rotatePiece(selectedPieceId, 90)) {
                        showAlert.toast('warning', 'No se puede rotar aquí: mueve la pieza a un espacio libre');
                      }
                    }}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-sky-700 hover:bg-sky-100 disabled:opacity-40"
                    title="Rotar pieza seleccionada 90° (tecla R)"
                  >
                    <RotateCw className="h-3.5 w-3.5" /> Rotar
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleLockPiece(selectedPiece.id)}
                    className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold ${selectedPiece.isLocked ? 'bg-amber-100 text-amber-800' : 'text-slate-600 hover:bg-slate-100'}`}
                    title={selectedPiece.isLocked ? 'Desbloquear pieza' : 'Bloquear pieza'}
                  >
                    <Lock className="h-3.5 w-3.5" /> {selectedPiece.isLocked ? 'Fija' : 'Fijar'}
                  </button>
                </div>
              )}

              <details className="group relative">
                <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-slate-700 shadow-xs hover:border-slate-400">
                  <Wrench className="h-3.5 w-3.5 text-slate-500" /> Herramientas
                </summary>
                <div className="absolute right-0 top-full z-50 mt-2 flex min-w-48 flex-col gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                {lockedCount > 0 && (
                <button 
                  onClick={handleReoptimize}
                  disabled={placedCount === 0 || isNesting}
                  className="flex items-center gap-1.5 px-3 py-2 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
                  title="Reacomoda las piezas no bloqueadas alrededor de las fijadas con candado"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                  Reoptimizar ({lockedCount} fijas)
                </button>
              )}

              {placedCount > 0 && (
                <button
                  onClick={async () => {
                    const confirmed = await showAlert.confirm(
                      '¿Limpiar acomodo actual?',
                      'Se reseteará la posición de las piezas en la bobina.'
                    );
                    if (confirmed) {
                      clearNesting();
                      showAlert.toast('info', 'Lienzo limpiado');
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 hover:bg-red-50 hover:text-red-600 text-slate-700 rounded-lg text-xs transition-colors cursor-pointer"
                  title="Limpiar acomodo"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  <span>Limpiar acomodo</span>
                </button>
              )}
                <button
                  type="button"
                  onClick={() => setShowPieceBorders((value) => !value)}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-100"
                >
                  <Eye className="h-3.5 w-3.5 text-slate-500" /> {showPieceBorders ? 'Ocultar contornos' : 'Mostrar contornos'}
                </button>
                </div>
              </details>
            </div>

            {/* Métricas directas de taller */}
            <div className="flex items-center gap-5 font-mono text-xs">
              <div className="text-slate-600">
                Pliegos: <strong className="text-violet-700">{sheets.length || 1} partes</strong>
              </div>
              <div className="text-slate-600">
                Largo Pliego: <strong className="text-sky-700 text-sm font-bold">{actualLengthM} m</strong>
              </div>
              <div className="text-slate-600">
                Aprovechamiento: <strong className="text-violet-700">{efficiency}%</strong>
              </div>
            </div>
          </div>}

          {/* SELECTOR DE PARTES / PLIEGOS PARTICIONADOS EN UN SELECT COMPACTO Y MODERNO */}
          {sheets.length > 0 && (
            <div className="bg-white border-b border-slate-200 px-6 py-2 flex flex-wrap items-center justify-between gap-3 flex-shrink-0 shadow-xs">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 font-mono">
                  <Layers className="w-4 h-4 text-violet-600" />
                  <span>PARTE / PLIEGO:</span>
                </span>
                <select
                  value={viewAllSheets ? 'ALL' : activeSheetIndex}
                  onChange={(e) => {
                    if (e.target.value === 'ALL') {
                      setViewAllSheets(true);
                    } else {
                      setViewAllSheets(false);
                      setActiveSheetIndex(Number(e.target.value));
                    }
                  }}
                  className="bg-white border border-slate-300 hover:border-violet-500 rounded-lg px-3 py-1.5 text-xs font-bold font-mono text-violet-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
                >
                  {sheets.map((sheet, idx) => {
                    const isCamiseta = sheet.garmentType === 'CAMISETA';
                    const lengthM = (sheet.heightMm / 1000).toFixed(2);
                    return (
                      <option key={sheet.id || idx} value={idx}>
                        {isCamiseta ? '👕' : '🩳'} {sheet.title} — {lengthM} m ({sheet.placedPieces.length} pzs)
                      </option>
                    );
                  })}
                  <option value="ALL">👁️ Ver Rollo Completo ({sheets.length} partes)</option>
                </select>

                <button
                  type="button"
                  onClick={() => setViewAllSheets(!viewAllSheets)}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono font-semibold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 ${
                    viewAllSheets
                      ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                  title={viewAllSheets ? 'Ver pliego individual' : 'Ver todo el rollo completo'}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{viewAllSheets ? 'Ver Pliego' : 'Ver Todo'}</span>
                </button>
              </div>

              {activeSheet && !viewAllSheets && (
                <div className="flex items-center gap-2 text-xs font-mono text-slate-600">
                  <span className="text-slate-400">Jugadores en esta parte:</span>
                  <span className="text-violet-700 font-bold truncate max-w-md bg-violet-50 px-2 py-0.5 rounded border border-violet-200">
                    {activeSheet.playerNames.join(', ')}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Lienzo del Rollo de Papel Interactivo con Renderizado Vectorial */}
          <div className="flex-1 relative bg-slate-100 overflow-hidden flex">
            <div 
              ref={viewportRef}
              onMouseDown={handleCanvasMouseDown}
              onWheel={handleWheel}
              className={`flex-1 overflow-hidden relative flex justify-center items-start p-8 select-none bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] ${
                isPanning ? 'cursor-grabbing' : 'cursor-default'
              }`}
            >
              {/* Pliego / Rollo de papel */}
              <div 
                className={`flex-shrink-0 shrink-0 bg-white border-2 border-violet-500/60 shadow-xl relative ${
                  isPanning ? '' : 'transition-transform duration-75'
                }`}
                style={{
                  width: `${canvasWidthPx}px`,
                  minHeight: `${canvasHeightPx}px`,
                  transform: `translate(${pan.x}px, ${pan.y}px)`,
                  boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
                }}
              >
                {/* Regla Milimétrica Superior */}
                <div className="h-7 bg-slate-50 border-b border-slate-200 flex items-center justify-between px-3 text-[10px] font-mono text-slate-600 select-none sticky top-0 z-20 backdrop-blur-sm whitespace-nowrap overflow-hidden">
                  <span className="flex items-center gap-1 flex-shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-600"></span> {formatWithUnits(0)}
                  </span>
                  <span className="text-violet-700 font-semibold tracking-wide uppercase truncate mx-2">
                    {viewAllSheets ? `PEDIDO COMPLETO • ${formatWithUnits(printableWidthMm)}` : `${activeSheet?.title || 'PLIEGO'} (${formatWithUnits(printableWidthMm)} × ${formatWithUnits(currentCanvasHeightMm)})`}
                  </span>
                  <span className="flex-shrink-0 font-medium">{formatWithUnits(printableWidthMm)}</span>
                </div>

                {/* Regla de Largo en Metros */}
                <div className="absolute left-0 top-7 bottom-0 w-6 border-r border-slate-200 bg-slate-50 pointer-events-none z-10 hidden sm:flex flex-col justify-between py-2 text-[9px] font-mono text-slate-500 px-1">
                  <span>0m</span>
                  <span>{(currentCanvasHeightMm * 0.25 / 1000).toFixed(1)}m</span>
                  <span>{(currentCanvasHeightMm * 0.5 / 1000).toFixed(1)}m</span>
                  <span>{(currentCanvasHeightMm * 0.75 / 1000).toFixed(1)}m</span>
                  <span className="text-sky-700 font-bold">{actualLengthM}m</span>
                </div>

                {/* Líneas Magnéticas de Alineación */}
                {dragState.isDragging && dragState.activeGuides.map((guide, idx) => {
                  if (guide.type === 'vertical') {
                    const leftPx = guide.positionMm * mmToPx;
                    return (
                      <div
                        key={`guide_v_${idx}`}
                        className="absolute top-0 bottom-0 pointer-events-none z-40 border-l-2 border-dashed border-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]"
                        style={{ left: `${leftPx}px` }}
                      >
                        <span className="bg-sky-600 text-white text-[9px] font-mono px-1.5 py-0.5 rounded shadow absolute top-9 -left-2 whitespace-nowrap">
                          {guide.label || formatWithUnits(guide.positionMm)}
                        </span>
                      </div>
                    );
                  } else {
                    const topPx = (guide.positionMm * mmToPx) + 28;
                    return (
                      <div
                        key={`guide_h_${idx}`}
                        className="absolute left-0 right-0 pointer-events-none z-40 border-t-2 border-dashed border-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]"
                        style={{ top: `${topPx}px` }}
                      >
                        <span className="bg-sky-600 text-white text-[9px] font-mono px-1.5 py-0.5 rounded shadow absolute left-2 -top-5 whitespace-nowrap">
                          {guide.label || formatWithUnits(guide.positionMm)}
                        </span>
                      </div>
                    );
                  }
                })}

                {/* Estado vacío cuando no hay piezas */}
                {placedCount === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                    <div className="text-center">
                      <Sparkles className="w-16 h-16 mx-auto text-violet-500 mb-3" />
                      <div className="text-lg font-bold font-mono tracking-widest text-slate-700">
                        ÁREA ÚTIL {formatWithUnits(printableWidthMm).toUpperCase()}
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-1">
                        {totalPieces > 0 
                          ? `${totalPieces} PIEZAS VECTORIALES LISTAS — HAZ CLIC EN "⚡ ACOMODAR INTELIGENTE"` 
                          : 'SIN PIEZAS CARGADAS'}
                      </div>
                    </div>
                  </div>
                )}

                {/* RENDERIZADO DE LAS PIEZAS CON VIEWPORT CULLING Y MEMOIZACIÓN */}
                <div className="relative w-full h-full p-0">
                  {visiblePieces.map((piece) => {
                    const isCurrentlyDragged = dragState.isDragging && dragState.pieceId === piece.id;
                    const isSelected = selectedPieceId === piece.id;
                    const useLightweight = isFarZoomLightweight && !isCurrentlyDragged && !isSelected;

                    return (
                      <CanvasPieceItem
                        key={piece.id}
                        piece={piece}
                        mmToPx={mmToPx}
                        isSelected={isSelected}
                        isCurrentlyDragged={isCurrentlyDragged}
                        dragX={isCurrentlyDragged ? dragState.currentPieceX : undefined}
                        dragY={isCurrentlyDragged ? dragState.currentPieceY : undefined}
                        isLightweight={useLightweight}
                        showBorders={showPieceBorders}
                        onPieceMouseDown={handlePieceMouseDown}
                        onSelectPiece={handleSelectPiece}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Exportación */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        placedPieces={currentDisplayedPieces}
        nestingResult={nestingResult}
        printableWidthMm={printableWidthMm}
      />
    </div>
  );
};
