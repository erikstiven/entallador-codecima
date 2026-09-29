import React, { useMemo } from 'react';
import { 
  Play, 
  RotateCw, 
  Lock, 
  Unlock, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Download, 
  Gauge, 
  Ruler, 
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Tag,
  Scissors,
  CheckCircle2,
  Clock,
  Percent,
  Trash2,
  Move,
  Magnet
} from 'lucide-react';
import { useProfileStore } from '@/modules/settings/profileStore';
import { useGeneratorStore } from '@/modules/generator/generatorStore';
import { useNestingStore } from '@/core/nesting/nestingStore';
import { useInteractiveCanvas } from '@/modules/canvas/useInteractiveCanvas';
import { NestingPieceInput } from '@/core/nesting/types';
import { ExportModal } from '@/modules/export/ExportModal';

export const ProductionNestingView: React.FC = () => {
  const { activeProfile } = useProfileStore();
  const { generatedPieces, generationResult, isGenerating, generatePieces } = useGeneratorStore();
  const { 
    placedPieces, 
    nestingResult, 
    isNesting, 
    nestingProgress,
    nestingMode, 
    setNestingMode,
    nestingAlgorithm,
    setNestingAlgorithm,
    runNesting, 
    toggleLockPiece, 
    rotatePiece,
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
  } = useInteractiveCanvas();

  const [isQueueOpen, setIsQueueOpen] = React.useState<boolean>(true);
  const [isExportModalOpen, setIsExportModalOpen] = React.useState<boolean>(false);

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

  // Ejecutar entallado completo
  const handleRunNesting = async () => {
    if (nestingPieceInputs.length === 0) return;
    await runNesting(nestingPieceInputs, {
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

  // Auto-iniciar entallado cuando se ingresa con piezas generadas no colocadas
  React.useEffect(() => {
    if (nestingPieceInputs.length > 0 && placedPieces.length === 0 && !isNesting) {
      handleRunNesting();
    }
  }, [nestingPieceInputs.length]);

  const canvasWidthPx = activeProfile.printableWidthMm * mmToPx;
  const canvasHeightPx = Math.max(
    1000,
    ((nestingResult?.totalRollLengthMm || 0) + 150) * mmToPx
  );

  // Métricas
  const totalPieces = generatedPieces.length;
  const placedCount = placedPieces.length;
  const lockedCount = placedPieces.filter((p) => p.isLocked).length;
  const totalGarments = generationResult?.totalGarments || 0;
  const actualLengthM = nestingResult ? (nestingResult.totalRollLengthMm / 1000.0).toFixed(2) : '0.00';
  const efficiency = nestingResult ? nestingResult.utilizationPercent.toFixed(1) : '0.0';
  const waste = nestingResult ? nestingResult.wastePercent.toFixed(1) : '0.0';

  // Helper para asignar color sutil según tipo de pieza
  const getPieceBadgeColor = (type: string) => {
    switch (type) {
      case 'DELANTERO':
        return 'bg-blue-900/40 border-blue-500/50 text-blue-300';
      case 'ESPALDA':
        return 'bg-emerald-900/40 border-emerald-500/50 text-emerald-300';
      case 'MANGA_IZQ':
      case 'MANGA_DER':
        return 'bg-amber-900/40 border-amber-500/50 text-amber-300';
      case 'SHORT_FRENTE':
      case 'SHORT_ESPALDA':
        return 'bg-purple-900/40 border-purple-500/50 text-purple-300';
      default:
        return 'bg-slate-800/60 border-slate-700 text-slate-300';
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-950 overflow-hidden select-none">
      {/* Top Nesting Control Ribbon */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-2.5 flex items-center justify-between flex-shrink-0 z-30">
        <div className="flex items-center gap-3">
          {/* Nesting Mode Selector */}
          <div className="flex items-center bg-slate-950 border border-slate-700/80 rounded-lg p-1 text-xs">
            <button
              onClick={() => {
                setNestingMode('MAX_SAVINGS');
                if (placedCount > 0) {
                  runNesting(nestingPieceInputs, { groupingMode: 'MAX_SAVINGS' });
                }
              }}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
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
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
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
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                nestingMode === 'BY_PLAYER'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Por Jugador
            </button>
          </div>

          {/* Algorithm Selector */}
          <div className="flex items-center bg-slate-950 border border-slate-700/80 rounded-lg p-1 text-xs">
            <button
              onClick={() => setNestingAlgorithm('POLYGONAL_CLIPPER2')}
              className={`px-2.5 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                nestingAlgorithm === 'POLYGONAL_CLIPPER2'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Nesting poligonal irregular con Clipper2: encaja piezas dentro de concavidades para máximo aprovechamiento"
            >
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Poligonal (Clipper2)</span>
            </button>
            <button
              onClick={() => setNestingAlgorithm('BOUNDING_BOX')}
              className={`px-2.5 py-1.5 rounded-md font-medium transition-all ${
                nestingAlgorithm === 'BOUNDING_BOX'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Nesting rápido de cajas envolventes"
            >
              Bounding Box
            </button>
          </div>

          <div className="h-6 w-px bg-slate-800" />

          {/* Action Buttons */}
          <button 
            onClick={handleRunNesting}
            disabled={totalPieces === 0 || isNesting}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold shadow-md transition-all ${
              totalPieces === 0 || isNesting
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950 cursor-pointer active:scale-95'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {isNesting ? `Optimizando (${nestingProgress}%)...` : 'Optimizar Nesting'}
          </button>

          <button 
            onClick={handleReoptimize}
            disabled={placedCount === 0 || isNesting}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
            title="Reacomoda las piezas no bloqueadas alrededor de las piezas bloqueadas con candado"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            Reoptimizar Resto ({lockedCount} 🔒)
          </button>

          {placedCount > 0 && (
            <button
              onClick={clearNesting}
              className="p-2 bg-slate-800/80 hover:bg-red-950 hover:text-red-400 text-slate-400 rounded-lg text-xs border border-slate-700 transition-colors"
              title="Limpiar entallado"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Viewport Zoom & Export */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-950 border border-slate-700 rounded-lg p-1 text-xs text-slate-400">
            <button
              onClick={() => setZoomLevel((z) => Math.max(z - 10, 20))}
              className="p-1 hover:text-white hover:bg-slate-800 rounded"
              title="Reducir zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px] text-slate-200">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(z + 10, 300))}
              className="p-1 hover:text-white hover:bg-slate-800 rounded"
              title="Aumentar zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setZoomLevel(65);
                setPan({ x: 0, y: 0 });
              }}
              className="px-2 py-0.5 hover:text-white hover:bg-slate-800 rounded font-mono text-[10px]"
              title="Centrar y ajustar a pantalla"
            >
              Ajustar
            </button>
          </div>

          <button 
            disabled={placedCount === 0}
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-sky-950 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar para RasterLink (1:1)
          </button>
        </div>
      </div>

      {/* Production Metrics Strip */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-6 py-2 flex items-center justify-between text-xs z-20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>Prendas: <strong className="text-white font-mono">{totalGarments}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Scissors className="w-3.5 h-3.5 text-slate-500" />
            <span>Piezas: <strong className="text-emerald-400 font-mono">{placedCount} / {totalPieces}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Ruler className="w-3.5 h-3.5 text-slate-500" />
            <span>Ancho Rollo: <strong className="text-white font-mono">{activeProfile.printableWidthMm} mm</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Largo Total: <strong className="text-sky-400 font-mono text-sm font-bold">{actualLengthM} m</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Percent className="w-3.5 h-3.5 text-emerald-400" />
            <span>Aprovechamiento: <strong className="text-emerald-400 font-mono">{efficiency}%</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Gauge className="w-3.5 h-3.5 text-slate-500" />
            <span>Motor: <strong className="text-sky-400 font-mono text-[11px]">{nestingAlgorithm === 'POLYGONAL_CLIPPER2' ? 'Clipper2 WASM' : 'BLF (AABB)'}</strong></span>
          </div>
          {nestingResult && (
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-mono">
              <Clock className="w-3 h-3" />
              <span>{nestingResult.executionTimeMs} ms</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsQueueOpen(!isQueueOpen)}
            className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1"
          >
            <span>Cola de Piezas ({totalPieces})</span>
            {isQueueOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Workspace Area with Interactive Paper Roll and Piece Queue */}
      <div className="flex-1 relative bg-[#0b0f19] overflow-hidden flex">
        {/* Left / Center: Interactive Roll Viewport with Pan, Zoom & Snapping */}
        <div 
          onMouseDown={handleCanvasMouseDown}
          onWheel={handleWheel}
          className={`flex-1 overflow-hidden relative flex justify-center items-start p-8 select-none bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] ${
            isPanning ? 'cursor-grabbing' : 'cursor-default'
          }`}
        >
          {/* Paper Roll Mockup with Pan & Zoom Transform */}
          <div 
            className="bg-slate-900/95 border-2 border-emerald-500/50 shadow-2xl relative transition-transform duration-75"
            style={{
              width: `${canvasWidthPx}px`,
              minHeight: `${canvasHeightPx}px`,
              transform: `translate(${pan.x}px, ${pan.y}px)`,
              boxShadow: '0 0 60px rgba(0,0,0,0.85)',
            }}
          >
            {/* Top Millimeter Ruler Guide */}
            <div className="h-7 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between px-3 text-[10px] font-mono text-slate-400 select-none sticky top-0 z-20 backdrop-blur-sm">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> 0 mm
              </span>
              <span className="text-emerald-400 font-semibold tracking-wide uppercase">
                {activeProfile.name} • {activeProfile.printableWidthMm} mm
              </span>
              <span>{activeProfile.printableWidthMm} mm</span>
            </div>

            {/* Left Edge Metric Ruler Guide */}
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

            {/* Magnetic Snapping Alignment Guide Lines */}
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

            {/* Roll Empty Watermark */}
            {placedCount === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                <div className="text-center">
                  <Sparkles className="w-24 h-24 mx-auto text-emerald-400 mb-3" />
                  <div className="text-2xl font-bold font-mono tracking-widest text-white">
                    ÁREA ÚTIL {activeProfile.printableWidthMm} MM
                  </div>
                  <div className="text-sm text-slate-300 font-mono mt-1">
                    {totalPieces > 0 ? `${totalPieces} PIEZAS VECTORIALES LISTAS — HAZ CLIC EN "OPTIMIZAR NESTING"` : 'SIN PIEZAS CARGADAS'}
                  </div>
                </div>
              </div>
            )}

            {/* Render Placed Pieces on the Roll Canvas with Interactive Drag & Drop */}
            <div className="relative w-full h-full p-0">
              {placedPieces.map((piece) => {
                const isCurrentlyDragged = dragState.isDragging && dragState.pieceId === piece.id;
                const currentX = isCurrentlyDragged ? dragState.currentPieceX : piece.xMm;
                const currentY = isCurrentlyDragged ? dragState.currentPieceY : piece.yMm;

                const posX = currentX * mmToPx;
                const posY = (currentY * mmToPx) + 28; // 28px por la barra superior de regla
                const widthPx = piece.effectiveWidthMm * mmToPx;
                const heightPx = piece.effectiveHeightMm * mmToPx;
                const isSelected = selectedPieceId === piece.id;

                return (
                  <div
                    key={piece.id}
                    data-piece="true"
                    onMouseDown={(e) => handlePieceMouseDown(e, piece.id, piece.xMm, piece.yMm)}
                    onClick={() => setSelectedPieceId(piece.id)}
                    className={`absolute rounded transition-shadow group select-none overflow-hidden ${
                      isCurrentlyDragged ? 'cursor-grabbing' : 'cursor-grab'
                    } ${
                      getPieceBadgeColor(piece.pieceType)
                    } ${
                      isCurrentlyDragged
                        ? 'ring-2 ring-cyan-400 border-cyan-400 shadow-2xl shadow-cyan-950/80 z-50 opacity-95 scale-[1.02]'
                        : isSelected 
                        ? 'ring-2 ring-sky-400 border-sky-400 shadow-lg shadow-sky-950/60 z-30' 
                        : 'hover:border-slate-400 hover:shadow-md z-10'
                    }`}
                    style={{
                      left: `${posX}px`,
                      top: `${posY}px`,
                      width: `${widthPx}px`,
                      height: `${heightPx}px`,
                    }}
                    title={`${piece.playerName} #${piece.playerNumber} | T${piece.sizeName} | ${piece.pieceType} (${piece.effectiveWidthMm.toFixed(0)}x${piece.effectiveHeightMm.toFixed(0)}mm)`}
                  >
                    {/* Floating pill while dragging */}
                    {isCurrentlyDragged && (
                      <div className="absolute -top-7 left-0 bg-cyan-950/95 border border-cyan-400 text-cyan-200 text-[9px] font-mono px-2 py-0.5 rounded shadow flex items-center gap-1.5 z-50">
                        <Magnet className="w-3 h-3 text-cyan-400" />
                        <span>X: {currentX.toFixed(1)} mm | Y: {currentY.toFixed(1)} mm</span>
                        {piece.isLocked && <Lock className="w-2.5 h-2.5 text-amber-400" />}
                      </div>
                    )}

                    {/* Header bar of placed piece with controls */}
                    <div className="h-5 px-1.5 bg-black/40 border-b border-white/10 flex items-center justify-between text-[10px] font-mono">
                      <span className="truncate font-bold text-white max-w-[70%]">
                        {piece.playerName} <span className="text-emerald-400">#{piece.playerNumber}</span>
                      </span>
                      <div className="flex items-center gap-1">
                        {/* Lock / Unlock button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLockPiece(piece.id);
                          }}
                          className={`p-0.5 rounded transition-colors ${
                            piece.isLocked 
                              ? 'text-amber-400 hover:text-amber-300 bg-amber-950/80' 
                              : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
                          }`}
                          title={piece.isLocked ? 'Pieza bloqueada (inmutable en reoptimización)' : 'Bloquear pieza en esta posición'}
                        >
                          {piece.isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                        </button>

                        {/* Rotate 180° button if allowed */}
                        {piece.allowedRotations.includes(180) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              rotatePiece(piece.id, 180);
                            }}
                            className="p-0.5 rounded text-slate-400 hover:text-white hover:bg-slate-700/60"
                            title="Rotar 180°"
                          >
                            <RotateCw className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Body: Piece details and visual feedback */}
                    <div className="p-2 flex flex-col justify-between h-[calc(100%-1.25rem)] text-[10px] font-mono pointer-events-none">
                      <div>
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="font-semibold text-white">{piece.pieceType}</span>
                          <span className="px-1 py-0.2 rounded bg-black/30 text-emerald-400 font-bold">
                            T{piece.sizeName}
                          </span>
                        </div>
                        <div className="text-[9px] text-slate-400 mt-0.5">
                          {piece.effectiveWidthMm.toFixed(0)} × {piece.effectiveHeightMm.toFixed(0)} mm
                        </div>
                        {piece.rotationDeg !== 0 && (
                          <div className="text-[9px] text-amber-400 mt-0.5">
                            ↺ {piece.rotationDeg}°
                          </div>
                        )}
                      </div>

                      {/* Small Seam Label at bottom */}
                      <div className="text-[8px] text-slate-400/80 truncate border-t border-white/5 pt-1">
                        X: {currentX.toFixed(0)}mm | Y: {currentY.toFixed(0)}mm
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Floating Workshop Instructions & Shortcuts Ribbon */}
          <div className="absolute bottom-4 left-6 bg-slate-900/90 border border-slate-700/80 backdrop-blur-md px-3.5 py-1.5 rounded-lg text-[11px] font-mono text-slate-300 flex items-center gap-4 shadow-2xl z-20 pointer-events-none">
            <span className="flex items-center gap-1.5 text-sky-400">
              <Move className="w-3.5 h-3.5" />
              <strong>Arrastrar con ratón</strong>
            </span>
            <span>🧲 Snapping 7 mm</span>
            <span>⌨️ R: Rotar</span>
            <span>🔒 L: Bloquear</span>
            <span>📐 Flechas: Mover 1 mm</span>
          </div>
        </div>

        {/* Right Slide-out Drawer: Generated Pieces Queue */}
        {isQueueOpen && (
          <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col justify-between flex-shrink-0 shadow-2xl z-20">
            <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-400" />
                Piezas Listas ({totalPieces})
              </span>
              {totalPieces === 0 && (
                <button
                  onClick={generatePieces}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  Generar
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {totalPieces === 0 ? (
                <div className="text-center py-12 text-xs text-slate-500 space-y-2">
                  <Scissors className="w-8 h-8 mx-auto text-slate-600" />
                  <p>Aún no se han generado piezas.</p>
                  <p className="text-[11px] text-slate-400">
                    Carga un pedido en "Nuevo Pedido" y haz clic en "Generar Prendas".
                  </p>
                </div>
              ) : (
                generatedPieces.map((piece) => {
                  const placed = placedPieces.find((p) => p.id === piece.id);
                  const isLocked = placed?.isLocked || false;

                  return (
                    <div
                      key={piece.id}
                      onClick={() => setSelectedPieceId(piece.id)}
                      className={`bg-slate-950 border rounded-lg p-3 hover:border-slate-700 transition-all text-xs space-y-1.5 cursor-pointer ${
                        selectedPieceId === piece.id 
                          ? 'border-sky-500 shadow-md shadow-sky-950/40' 
                          : 'border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white font-mono truncate">
                          {piece.playerName} <span className="text-emerald-400">#{piece.playerNumber}</span>
                        </span>
                        <div className="flex items-center gap-1">
                          {placed && (
                            <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" />
                            </span>
                          )}
                          {isLocked && <Lock className="w-3 h-3 text-amber-400" />}
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            T{piece.sizeName}
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center justify-between font-mono">
                        <span>{piece.pieceType}</span>
                        <span className="text-slate-300">
                          {piece.bbox.width.toFixed(0)} × {piece.bbox.height.toFixed(0)} mm
                        </span>
                      </div>

                      <div className="text-[10px] text-slate-500 truncate font-mono pt-1 border-t border-slate-900 flex items-center justify-between">
                        <span>{piece.label.text}</span>
                        {placed && (
                          <span className="text-slate-400 font-mono">
                            Y: {placed.yMm.toFixed(0)} mm
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Exportación 1:1 */}
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
