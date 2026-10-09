import React, { useMemo, useState } from 'react';
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
  FileCheck
} from 'lucide-react';
import { useProfileStore } from '@/modules/settings/profileStore';
import { useGeneratorStore } from '@/modules/generator/generatorStore';
import { useNestingStore } from '@/core/nesting/nestingStore';
import { useInteractiveCanvas } from '@/modules/canvas/useInteractiveCanvas';
import { NestingPieceInput, NestingSheet } from '@/core/nesting/types';
import { ExportModal } from '@/modules/export/ExportModal';
import { GarmentInspectionTab } from './GarmentInspectionTab';
import { showAlert } from '@/core/ui/alerts';

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
    setSelectedPieceId
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
      svgContent: gp.svgContent,
    }));
  }, [generatedPieces]);

  // Ejecutar entallado en rollo
  const handleRunNesting = async (overrideInputs?: NestingPieceInput[] | unknown) => {
    const inputsToNest = Array.isArray(overrideInputs) ? overrideInputs : nestingPieceInputs;
    if (inputsToNest.length === 0) return;
    await runNesting(inputsToNest, {
      printableWidthMm,
      maxSheetLengthMm,
      spacingMm,
      groupingMode: nestingMode,
    });
    showAlert.toast('success', '¡Pliegos organizados y optimizados!');
  };

  // Reoptimizar piezas no bloqueadas
  const handleReoptimize = async () => {
    if (nestingPieceInputs.length === 0) return;
    await reoptimizeUnlocked(nestingPieceInputs);
  };

  // Pliego activo
  const activeSheet: NestingSheet | undefined = sheets[activeSheetIndex] || sheets[0];

  // Piezas a renderizar (del pliego activo o de todos si está en vista general)
  const currentDisplayedPieces = useMemo(() => {
    if (viewAllSheets || !activeSheet) return placedPieces;
    return activeSheet.placedPieces;
  }, [placedPieces, activeSheet, viewAllSheets]);

  // Dimensiones del lienzo según el pliego activo
  const currentCanvasHeightMm = useMemo(() => {
    if (viewAllSheets || !activeSheet) {
      return nestingResult?.totalRollLengthMm || 1000;
    }
    return activeSheet.heightMm;
  }, [viewAllSheets, activeSheet, nestingResult]);

  const canvasWidthPx = printableWidthMm * mmToPx;
  const canvasHeightPx = Math.max(1000, (currentCanvasHeightMm + 150) * mmToPx);

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
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-950 overflow-hidden select-none">
      {generationResult && generationResult.warnings.length > 0 && (
        <div className="flex-shrink-0 border-b border-amber-500/40 bg-amber-950/70 px-6 py-2 text-xs text-amber-100">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-none text-amber-400" />
            <div className="min-w-0 flex-1">
              <div>
                <strong className="text-amber-300">Producción incompleta:</strong>{' '}
                {warningSummaries.join(' ')}
              </div>
              <details className="mt-1">
                <summary className="w-fit cursor-pointer font-semibold text-amber-300 hover:underline">
                  Ver detalle ({generationResult.warnings.length})
                </summary>
                <ul className="mt-1.5 max-h-28 list-disc space-y-1 overflow-y-auto pl-5 text-[11px] text-amber-100">
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
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-2 flex items-center justify-between flex-shrink-0 z-30">
        {/* Selector de Pestañas: 1. Revisión vs 2. Rollo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs">
            <button
              onClick={() => setActiveTab('INSPECTION')}
              className={`px-3.5 py-1.5 rounded-md font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'INSPECTION'
                  ? 'bg-violet-600 text-white shadow-md shadow-purple-950'
                  : 'text-slate-400 hover:text-slate-200'
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
                  ? 'bg-violet-600 text-white shadow-md shadow-purple-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>2. Rollo de Sublimación ({printableWidthMm} mm)</span>
            </button>
          </div>
        </div>

        {/* Acciones del Extremo Derecho (Solo cuando se visualiza el Rollo) */}
        {activeTab === 'ROLL' && (
          <div className="flex items-center gap-3">
            {/* Controles de Zoom del Rollo */}
            <div className="flex items-center bg-slate-950 border border-slate-700 rounded-lg p-1 text-xs text-slate-400">
              <button
                onClick={() => setZoomLevel((z) => Math.max(z - 10, 15))}
                className="p-1 hover:text-white hover:bg-slate-800 rounded cursor-pointer"
                title="Reducir zoom"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-mono text-[11px] text-slate-200 min-w-[42px] text-center">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(z + 10, 300))}
                className="p-1 hover:text-white hover:bg-slate-800 rounded cursor-pointer"
                title="Aumentar zoom"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  const w = typeof window !== 'undefined' ? window.innerWidth : 1100;
                  fitToWidth(w - 80);
                }}
                className="px-2 py-0.5 hover:text-white hover:bg-slate-800 rounded font-mono text-[10px] text-purple-400 font-semibold cursor-pointer"
                title="Ajustar ancho del rollo a la pantalla para ver prendas grandes"
              >
                Ajustar Ancho
              </button>
              <button
                onClick={() => {
                  const w = typeof window !== 'undefined' ? window.innerWidth : 1100;
                  const h = typeof window !== 'undefined' ? window.innerHeight : 800;
                  fitToAll(w - 80, h - 160);
                }}
                className="px-2 py-0.5 hover:text-white hover:bg-slate-800 rounded font-mono text-[10px] text-sky-400 cursor-pointer"
                title="Ver todo el largo del rollo"
              >
                Ver Todo
              </button>
            </div>

            <button 
              disabled={placedCount === 0}
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold shadow-md shadow-sky-950 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar {sheets.length > 1 && !viewAllSheets ? `Pliego (${activeSheet?.sheetNumber || 1}/${sheets.length})` : 'Producción 1:1'}</span>
            </button>
          </div>
        )}
      </div>

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
              svgContent: gp.svgContent,
            }));
            if (inputs.length > 0 && !isNesting) {
              handleRunNesting(inputs);
            }
          }}
        />
      ) : (
        /* PESTAÑA 2: ROLLO DE SUBLIMACIÓN (NESTING MODULAR MULTI-ARCHIVO) */
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Cinta superior de configuración de Bobina y Pliego */}
          <div className="bg-slate-900/95 border-b border-slate-800 px-6 py-2 flex flex-wrap items-center justify-between gap-4 z-20 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              {/* 1. Selector de Ancho de Bobina */}
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Bobina:</span>
                <select
                  value={printableWidthMm}
                  onChange={(e) => {
                    const newW = Number(e.target.value);
                    setPrintableWidthMm(newW);
                    runNesting(nestingPieceInputs, { printableWidthMm: newW, maxSheetLengthMm });
                  }}
                  className="bg-transparent text-purple-400 font-bold font-mono focus:outline-none cursor-pointer"
                >
                  <option value={1120} className="bg-slate-900 text-white">1120 mm (1.12 m)</option>
                  <option value={1600} className="bg-slate-900 text-white">1600 mm (1.60 m)</option>
                  <option value={1800} className="bg-slate-900 text-white">1800 mm (1.80 m)</option>
                  <option value={1900} className="bg-slate-900 text-white">1900 mm (1.90 m)</option>
                </select>
              </div>

              {/* 2. Selector de Largo Máximo de Pliego / Archivo */}
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Máx. Pliego:</span>
                <select
                  value={maxSheetLengthMm}
                  onChange={(e) => {
                    const newH = Number(e.target.value);
                    setMaxSheetLengthMm(newH);
                    runNesting(nestingPieceInputs, { printableWidthMm, maxSheetLengthMm: newH, spacingMm });
                  }}
                  className="bg-transparent text-sky-400 font-bold font-mono focus:outline-none cursor-pointer"
                >
                  <option value={2500} className="bg-slate-900 text-white">250 cm (2.5 m)</option>
                  <option value={3000} className="bg-slate-900 text-white">300 cm (3.0 m)</option>
                  <option value={5000} className="bg-slate-900 text-white">500 cm (5.0 m)</option>
                  <option value={10000} className="bg-slate-900 text-white">1000 cm (10.0 m)</option>
                </select>
              </div>

              {/* 3. Selector de Separación / Pegada entre Piezas */}
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Separación:</span>
                <select
                  value={spacingMm}
                  onChange={(e) => {
                    const newS = Number(e.target.value);
                    setSpacingMm(newS);
                    runNesting(nestingPieceInputs, { printableWidthMm, maxSheetLengthMm, spacingMm: newS });
                  }}
                  className="bg-transparent text-emerald-400 font-bold font-mono focus:outline-none cursor-pointer"
                >
                  <option value={2} className="bg-slate-900 text-white">2 mm (Ultra pegada)</option>
                  <option value={3} className="bg-slate-900 text-white">3 mm (Pegada recomendada)</option>
                  <option value={5} className="bg-slate-900 text-white">5 mm</option>
                  <option value={6} className="bg-slate-900 text-white">6 mm (Holgada)</option>
                </select>
              </div>

              {/* Botón Reorganizar Rollo */}
              <button 
                onClick={() => handleRunNesting()}
                disabled={totalPieces === 0 || isNesting}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-md transition-all ${
                  totalPieces === 0 || isNesting
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-violet-600 hover:bg-violet-500 text-white shadow-purple-950 cursor-pointer active:scale-95'
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                {isNesting ? `Optimizando (${nestingProgress}%)...` : 'Reorganizar Pliegos'}
              </button>

              {lockedCount > 0 && (
                <button 
                  onClick={handleReoptimize}
                  disabled={placedCount === 0 || isNesting}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
                  title="Reacomoda las piezas no bloqueadas alrededor de las fijadas con candado"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
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
                  className="p-1.5 bg-slate-800 hover:bg-red-950 hover:text-red-400 text-slate-400 rounded-lg text-xs border border-slate-700 transition-colors cursor-pointer"
                  title="Limpiar acomodo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Métricas directas de taller */}
            <div className="flex items-center gap-5 font-mono text-xs">
              <div className="text-slate-400">
                Pliegos: <strong className="text-purple-400">{sheets.length || 1} partes</strong>
              </div>
              <div className="text-slate-400">
                Largo Pliego: <strong className="text-sky-400 text-sm font-bold">{actualLengthM} m</strong>
              </div>
              <div className="text-slate-400">
                Aprovechamiento: <strong className="text-purple-400">{efficiency}%</strong>
              </div>
            </div>
          </div>

          {/* TIRA DE PESTAÑAS DE PLIEGOS PARTICIONADOS (PARTE 1, PARTE 2...) */}
          {sheets.length > 0 && (
            <div className="bg-slate-950 border-b border-slate-800/80 px-6 py-2 overflow-x-auto flex items-center justify-between gap-3 flex-shrink-0 scrollbar-thin">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 uppercase font-mono font-bold">Archivos RIP:</span>
                {sheets.map((sheet, idx) => {
                  const isSelected = !viewAllSheets && idx === activeSheetIndex;
                  const isCamiseta = sheet.garmentType === 'CAMISETA';
                  const lengthM = (sheet.heightMm / 1000).toFixed(2);

                  return (
                    <button
                      key={sheet.id || idx}
                      onClick={() => {
                        setViewAllSheets(false);
                        setActiveSheetIndex(idx);
                      }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all flex-shrink-0 cursor-pointer ${
                        isSelected
                          ? 'bg-purple-950/90 border-violet-500 text-white shadow-md shadow-purple-950/50 scale-[1.02] font-bold'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      {isCamiseta ? (
                        <Shirt className={`w-3.5 h-3.5 ${isSelected ? 'text-purple-400' : 'text-slate-500'}`} />
                      ) : (
                        <Scissors className={`w-3.5 h-3.5 ${isSelected ? 'text-sky-400' : 'text-slate-500'}`} />
                      )}
                      <span>{sheet.title}</span>
                      <span className="px-1.5 py-0.2 rounded bg-black/50 text-[10px] text-amber-400 font-bold">
                        {lengthM} m
                      </span>
                      <span className="text-[10px] text-slate-500">
                        ({sheet.placedPieces.length} pzs)
                      </span>
                    </button>
                  );
                })}

                <button
                  onClick={() => setViewAllSheets(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all flex-shrink-0 cursor-pointer ${
                    viewAllSheets
                      ? 'bg-purple-950/90 border-violet-500 text-white shadow-md shadow-purple-950/50 scale-[1.02] font-bold'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  <span>Ver Rollo Completo</span>
                </button>
              </div>

              {activeSheet && !viewAllSheets && (
                <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono text-slate-400">
                  <span className="text-slate-500">Jugadores en esta parte:</span>
                  <span className="text-slate-300 font-semibold truncate max-w-xs">
                    {activeSheet.playerNames.join(', ')}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Lienzo del Rollo de Papel Interactivo con Renderizado Vectorial */}
          <div className="flex-1 relative bg-[#0b0f19] overflow-hidden flex">
            <div 
              onMouseDown={handleCanvasMouseDown}
              onWheel={handleWheel}
              className={`flex-1 overflow-hidden relative flex justify-center items-start p-8 select-none bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] ${
                isPanning ? 'cursor-grabbing' : 'cursor-default'
              }`}
            >
              {/* Pliego / Rollo de papel */}
              <div 
                className="bg-slate-900 border-2 border-violet-500/50 shadow-2xl relative transition-transform duration-75"
                style={{
                  width: `${canvasWidthPx}px`,
                  minHeight: `${canvasHeightPx}px`,
                  transform: `translate(${pan.x}px, ${pan.y}px)`,
                  boxShadow: '0 0 60px rgba(0,0,0,0.85)',
                }}
              >
                {/* Regla Milimétrica Superior */}
                <div className="h-7 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between px-3 text-[10px] font-mono text-slate-400 select-none sticky top-0 z-20 backdrop-blur-sm whitespace-nowrap overflow-hidden">
                  <span className="flex items-center gap-1 flex-shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span> 0 mm
                  </span>
                  <span className="text-purple-400 font-semibold tracking-wide uppercase truncate mx-2">
                    {viewAllSheets ? `PEDIDO COMPLETO • ${printableWidthMm} mm` : `${activeSheet?.title || 'PLIEGO'} (${printableWidthMm} × ${currentCanvasHeightMm.toFixed(0)} mm)`}
                  </span>
                  <span className="flex-shrink-0">{printableWidthMm} mm</span>
                </div>

                {/* Regla de Largo en Metros */}
                <div className="absolute left-0 top-7 bottom-0 w-6 border-r border-slate-800/80 bg-slate-950/60 pointer-events-none z-10 hidden sm:flex flex-col justify-between py-2 text-[9px] font-mono text-slate-600 px-1">
                  <span>0m</span>
                  <span>{(currentCanvasHeightMm * 0.25 / 1000).toFixed(1)}m</span>
                  <span>{(currentCanvasHeightMm * 0.5 / 1000).toFixed(1)}m</span>
                  <span>{(currentCanvasHeightMm * 0.75 / 1000).toFixed(1)}m</span>
                  <span className="text-sky-400 font-bold">{actualLengthM}m</span>
                </div>

                {/* Líneas Magnéticas de Alineación */}
                {dragState.isDragging && dragState.activeGuides.map((guide, idx) => {
                  if (guide.type === 'vertical') {
                    const leftPx = guide.positionMm * mmToPx;
                    return (
                      <div
                        key={`guide_v_${idx}`}
                        className="absolute top-0 bottom-0 pointer-events-none z-40 border-l-2 border-dashed border-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"
                        style={{ left: `${leftPx}px` }}
                      >
                        <span className="bg-cyan-950/95 text-cyan-300 border border-cyan-500/80 text-[9px] font-mono px-1.5 py-0.5 rounded shadow absolute top-9 -left-2 whitespace-nowrap">
                          {guide.label || `${guide.positionMm.toFixed(0)} mm`}
                        </span>
                      </div>
                    );
                  } else {
                    const topPx = (guide.positionMm * mmToPx) + 28;
                    return (
                      <div
                        key={`guide_h_${idx}`}
                        className="absolute left-0 right-0 pointer-events-none z-40 border-t-2 border-dashed border-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"
                        style={{ top: `${topPx}px` }}
                      >
                        <span className="bg-cyan-950/95 text-cyan-300 border border-cyan-500/80 text-[9px] font-mono px-1.5 py-0.5 rounded shadow absolute left-2 -top-5 whitespace-nowrap">
                          {guide.label || `${guide.positionMm.toFixed(0)} mm`}
                        </span>
                      </div>
                    );
                  }
                })}

                {/* Estado vacío cuando no hay piezas */}
                {placedCount === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25">
                    <div className="text-center">
                      <Sparkles className="w-20 h-20 mx-auto text-purple-400 mb-3" />
                      <div className="text-xl font-bold font-mono tracking-widest text-white">
                        ÁREA ÚTIL {printableWidthMm} MM
                      </div>
                      <div className="text-xs text-slate-300 font-mono mt-1">
                        {totalPieces > 0 
                          ? `${totalPieces} PIEZAS VECTORIALES LISTAS — HAZ CLIC EN "REORGANIZAR PLIEGOS"` 
                          : 'SIN PIEZAS CARGADAS'}
                      </div>
                    </div>
                  </div>
                )}

                {/* RENDERIZADO DE LAS PIEZAS CON ARTE VECTORIAL REAL */}
                <div className="relative w-full h-full p-0">
                  {currentDisplayedPieces.map((piece) => {
                    const isCurrentlyDragged = dragState.isDragging && dragState.pieceId === piece.id;
                    const currentX = isCurrentlyDragged ? dragState.currentPieceX : piece.xMm;
                    const currentY = isCurrentlyDragged ? dragState.currentPieceY : piece.yMm;

                    const posX = currentX * mmToPx;
                    const posY = (currentY * mmToPx) + 28;
                    const widthPx = piece.effectiveWidthMm * mmToPx;
                    const heightPx = piece.effectiveHeightMm * mmToPx;
                    const isSelected = selectedPieceId === piece.id;

                    return (
                      <div
                        key={piece.id}
                        data-piece="true"
                        onMouseDown={(e) => handlePieceMouseDown(e, piece.id, piece.xMm, piece.yMm)}
                        onClick={() => setSelectedPieceId(piece.id)}
                        className={`absolute rounded transition-shadow group select-none overflow-hidden bg-slate-950/90 border ${
                          isCurrentlyDragged
                            ? 'cursor-grabbing ring-2 ring-cyan-400 border-cyan-400 shadow-2xl shadow-cyan-950 z-50 opacity-95 scale-[1.01]'
                            : isSelected 
                            ? 'ring-2 ring-sky-400 border-sky-400 shadow-xl shadow-sky-950/60 z-30 cursor-grab' 
                            : 'border-slate-700/80 hover:border-slate-400 hover:shadow-lg z-10 cursor-grab'
                        }`}
                        style={{
                          left: `${posX}px`,
                          top: `${posY}px`,
                          width: `${widthPx}px`,
                          height: `${heightPx}px`,
                        }}
                      >
                        {/* SVG del arte de la pieza con su máscara de molde */}
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
                            <g dangerouslySetInnerHTML={{ __html: piece.svgContent || '' }} />
                          </g>
                        </svg>

                        {/* Overlay informativo de pieza al pasar el cursor */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 text-[10px] font-mono text-white pointer-events-none">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-amber-400">{piece.playerName}</span>
                            <span className="text-purple-300">#{piece.playerNumber} • T{piece.sizeName}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-400">
                            <span>{piece.pieceType}</span>
                            <span>{piece.effectiveWidthMm.toFixed(0)} × {piece.effectiveHeightMm.toFixed(0)} mm</span>
                          </div>
                        </div>
                      </div>
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
