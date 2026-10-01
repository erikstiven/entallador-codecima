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
  ZoomOut
} from 'lucide-react';
import { useProfileStore } from '@/modules/settings/profileStore';
import { useGeneratorStore } from '@/modules/generator/generatorStore';
import { useNestingStore } from '@/core/nesting/nestingStore';
import { useInteractiveCanvas } from '@/modules/canvas/useInteractiveCanvas';
import { NestingPieceInput } from '@/core/nesting/types';
import { ExportModal } from '@/modules/export/ExportModal';
import { GarmentInspectionTab } from './GarmentInspectionTab';

export const ProductionNestingView: React.FC = () => {
  const { activeProfile } = useProfileStore();
  const { generatedPieces, generationResult, setProductionScope } = useGeneratorStore();
  const { 
    placedPieces, 
    nestingResult, 
    isNesting, 
    nestingProgress,
    nestingMode, 
    setNestingMode,
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
    setPan,
    isPanning,
    dragState,
    mmToPx,
    handlePieceMouseDown,
    handleCanvasMouseDown,
    handleWheel,
    fitToWidth,
    fitToAll,
  } = useInteractiveCanvas();

  // Pestaña activa: 'INSPECTION' (Revisión de prendas por jugador/talla) o 'ROLL' (Acomodo en rollo de 1120 mm)
  const [activeTab, setActiveTab] = useState<'INSPECTION' | 'ROLL'>('INSPECTION');
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

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
      printableWidthMm: activeProfile.printableWidthMm,
      spacingMm: activeProfile.pieceSpacingMm || 7.0,
      groupingMode: nestingMode,
    });
  };

  // Reoptimizar piezas no bloqueadas
  const handleReoptimize = async () => {
    if (nestingPieceInputs.length === 0) return;
    await reoptimizeUnlocked(nestingPieceInputs);
  };

  // Dimensiones del lienzo del rollo
  const canvasWidthPx = activeProfile.printableWidthMm * mmToPx;
  const canvasHeightPx = Math.max(
    1000,
    ((nestingResult?.totalRollLengthMm || 0) + 150) * mmToPx
  );

  // Métricas de producción
  const totalPieces = generatedPieces.length;
  const placedCount = placedPieces.length;
  const lockedCount = placedPieces.filter((p) => p.isLocked).length;
  const totalGarments = generationResult?.totalGarments || 0;
  const actualLengthM = nestingResult ? (nestingResult.totalRollLengthMm / 1000.0).toFixed(2) : '0.00';
  const efficiency = nestingResult ? nestingResult.utilizationPercent.toFixed(1) : '0.0';

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-950 overflow-hidden select-none">
      {/* Barra de Navegación Principal del Flujo de Producción */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-2 flex items-center justify-between flex-shrink-0 z-30">
        {/* Selector de Pestañas: 1. Revisión vs 2. Rollo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs">
            <button
              onClick={() => setActiveTab('INSPECTION')}
              className={`px-3.5 py-1.5 rounded-md font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'INSPECTION'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
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
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>2. Rollo de Sublimación ({activeProfile.printableWidthMm} mm)</span>
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
                className="px-2 py-0.5 hover:text-white hover:bg-slate-800 rounded font-mono text-[10px] text-emerald-400 font-semibold cursor-pointer"
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
              Exportar producción 1:1
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
        /* PESTAÑA 2: ROLLO DE SUBLIMACIÓN (NESTING) */
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Cinta superior de control y métricas limpias */}
          <div className="bg-slate-900/90 border-b border-slate-800 px-6 py-2 flex flex-wrap items-center justify-between gap-4 z-20 text-xs">
            <div className="flex items-center gap-3">
              {/* Selector de Modo de Agrupamiento */}
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
                <button
                  onClick={() => {
                    setNestingMode('MAX_SAVINGS');
                    if (placedCount > 0) {
                      runNesting(nestingPieceInputs, { groupingMode: 'MAX_SAVINGS' });
                    }
                  }}
                  className={`px-3 py-1 rounded-md font-medium transition-all ${
                    nestingMode === 'MAX_SAVINGS'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Máximo Ahorro
                </button>
                <button
                  onClick={() => {
                    setNestingMode('BY_SIZE');
                    if (placedCount > 0) {
                      runNesting(nestingPieceInputs, { groupingMode: 'BY_SIZE' });
                    }
                  }}
                  className={`px-3 py-1 rounded-md font-medium transition-all ${
                    nestingMode === 'BY_SIZE'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Por Talla
                </button>
                <button
                  onClick={() => {
                    setNestingMode('BY_PLAYER');
                    if (placedCount > 0) {
                      runNesting(nestingPieceInputs, { groupingMode: 'BY_PLAYER' });
                    }
                  }}
                  className={`px-3 py-1 rounded-md font-medium transition-all ${
                    nestingMode === 'BY_PLAYER'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Por Jugador
                </button>
              </div>

              {/* Botón Reorganizar Rollo */}
              <button 
                onClick={() => handleRunNesting()}
                disabled={totalPieces === 0 || isNesting}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-md transition-all ${
                  totalPieces === 0 || isNesting
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950 cursor-pointer active:scale-95'
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                {isNesting ? `Optimizando (${nestingProgress}%)...` : 'Reorganizar Rollo'}
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
                  onClick={clearNesting}
                  className="p-1.5 bg-slate-800 hover:bg-red-950 hover:text-red-400 text-slate-400 rounded-lg text-xs border border-slate-700 transition-colors"
                  title="Limpiar acomodo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Métricas directas de taller */}
            <div className="flex items-center gap-5 font-mono text-xs">
              <div className="text-slate-400">
                Piezas: <strong className="text-emerald-400">{placedCount} / {totalPieces}</strong>
              </div>
              <div className="text-slate-400">
                Ancho: <strong className="text-white">{activeProfile.printableWidthMm} mm</strong>
              </div>
              <div className="text-slate-400">
                Largo Rollo: <strong className="text-sky-400 text-sm font-bold">{actualLengthM} m</strong>
              </div>
              <div className="text-slate-400">
                Aprovechamiento: <strong className="text-emerald-400">{efficiency}%</strong>
              </div>

            </div>
          </div>

          {/* Lienzo del Rollo de Papel Interactivo con Renderizado Vectorial */}
          <div className="flex-1 relative bg-[#0b0f19] overflow-hidden flex">
            <div 
              onMouseDown={handleCanvasMouseDown}
              onWheel={handleWheel}
              className={`flex-1 overflow-hidden relative flex justify-center items-start p-8 select-none bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] ${
                isPanning ? 'cursor-grabbing' : 'cursor-default'
              }`}
            >
              {/* Rollo de papel 1120 mm */}
              <div 
                className="bg-slate-900 border-2 border-emerald-500/50 shadow-2xl relative transition-transform duration-75"
                style={{
                  width: `${canvasWidthPx}px`,
                  minHeight: `${canvasHeightPx}px`,
                  transform: `translate(${pan.x}px, ${pan.y}px)`,
                  boxShadow: '0 0 60px rgba(0,0,0,0.85)',
                }}
              >
                {/* Regla Milimétrica Superior */}
                <div className="h-7 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between px-3 text-[10px] font-mono text-slate-400 select-none sticky top-0 z-20 backdrop-blur-sm">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> 0 mm
                  </span>
                  <span className="text-emerald-400 font-semibold tracking-wide uppercase">
                    {activeProfile.name} • {activeProfile.printableWidthMm} mm
                  </span>
                  <span>{activeProfile.printableWidthMm} mm</span>
                </div>

                {/* Regla de Largo en Metros */}
                <div className="absolute left-0 top-7 bottom-0 w-6 border-r border-slate-800/80 bg-slate-950/60 pointer-events-none z-10 hidden sm:flex flex-col justify-between py-2 text-[9px] font-mono text-slate-600 px-1">
                  <span>0m</span>
                  {nestingResult && (
                    <>
                      <span>{(nestingResult.totalRollLengthMm * 0.25 / 1000).toFixed(1)}m</span>
                      <span>{(nestingResult.totalRollLengthMm * 0.5 / 1000).toFixed(1)}m</span>
                      <span>{(nestingResult.totalRollLengthMm * 0.75 / 1000).toFixed(1)}m</span>
                      <span className="text-sky-400 font-bold">{actualLengthM}m</span>
                    </>
                  )}
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
                      <Sparkles className="w-20 h-20 mx-auto text-emerald-400 mb-3" />
                      <div className="text-xl font-bold font-mono tracking-widest text-white">
                        ÁREA ÚTIL {activeProfile.printableWidthMm} MM
                      </div>
                      <div className="text-xs text-slate-300 font-mono mt-1">
                        {totalPieces > 0 
                          ? `${totalPieces} PIEZAS VECTORIALES LISTAS — HAZ CLIC EN "REORGANIZAR ROLLO"` 
                          : 'SIN PIEZAS CARGADAS'}
                      </div>
                    </div>
                  </div>
                )}

                {/* RENDERIZADO DE LAS PIEZAS CON ARTE VECTORIAL REAL */}
                <div className="relative w-full h-full p-0">
                  {placedPieces.map((piece) => {
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
                        title={`${piece.playerName} #${piece.playerNumber} | T${piece.sizeName} | ${piece.pieceType} (${piece.effectiveWidthMm.toFixed(0)}x${piece.effectiveHeightMm.toFixed(0)}mm)`}
                      >
                        {/* Arte Vectorial Real de la Prenda Sublimada */}
                        <div 
                          className="w-full h-full relative pointer-events-none overflow-hidden"
                          style={{
                            transform: piece.rotationDeg ? `rotate(${piece.rotationDeg}deg)` : undefined,
                            transformOrigin: 'center center',
                          }}
                        >
                          {piece.svgContent ? (
                            <svg
                              viewBox={`0 0 ${piece.bbox.width} ${piece.bbox.height}`}
                              className="w-full h-full object-contain"
                              preserveAspectRatio="xMidYMid meet"
                              dangerouslySetInnerHTML={{ __html: piece.svgContent }}
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
                              <span className="font-bold text-white text-xs">{piece.playerName} #{piece.playerNumber}</span>
                              <span className="text-[10px] text-slate-400">{piece.pieceType}</span>
                            </div>
                          )}
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

      {/* Modal de Exportación 1:1 a RasterLink */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        placedPieces={placedPieces}
        nestingResult={nestingResult}
        printableWidthMm={activeProfile.printableWidthMm}
      />
    </div>
  );
};
