import React, { useEffect, useRef, useState } from 'react';
import { 
  Scissors, 
  Plus, 
  CheckCircle, 
  FileCode, 
  Sliders, 
  Trash2, 
  Layers, 
  AlertTriangle, 
  Download,
  Eye,
  Check,
  Ruler,
  Save
} from 'lucide-react';
import { usePatternStore } from '@/modules/patterns/patternStore';
import { PieceType, PatternPiece } from '@/modules/patterns/types';
import { polygonToSvgPath } from '@/core/geometry/transform';

export const PatternsView: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    patternSets,
    activePatternSet,
    selectedPieceForAssignment,
    loadFromDatabase,
    importSvg,
    selectPieceForAssignment,
    assignPieceManually,
    setActivePatternSet,
    deletePatternSet,
    discardUnassignedPiece,
    discardAllUnassignedPieces,
    deletePieceFromSize,
    updatePieceType,
    clearAllPatterns,
    saveActiveSet,
  } = usePatternStore();

  const [activeSizeTab, setActiveSizeTab] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const handleSavePatterns = () => {
    saveActiveSet();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  // Formulario de asignación manual
  const [assignSize, setAssignSize] = useState<string>('28');
  const [assignType, setAssignType] = useState<PieceType>('DELANTERO');
  const [rot0, setRot0] = useState<boolean>(true);
  const [rot90, setRot90] = useState<boolean>(false);
  const [rot180, setRot180] = useState<boolean>(false);
  const [rot270, setRot270] = useState<boolean>(false);

  useEffect(() => {
    loadFromDatabase();
  }, []);

  useEffect(() => {
    if (activePatternSet && activePatternSet.sizes.length > 0 && !activeSizeTab) {
      setActiveSizeTab(activePatternSet.sizes[0].sizeName);
    }
  }, [activePatternSet]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const setName = file.name.replace(/\.[^/.]+$/, '').toUpperCase();
        importSvg(content, setName, 'FUTBOL', file.name);
      }
    };
    reader.readAsText(file);
  };



  const handleDownloadScript = () => {
    const scriptContent = `/**
 * HMB ENTALLADOR — SCRIPT PARA ADOBE ILLUSTRATOR
 */
#target illustrator
function exportMoldesParaHmb() {
  if (app.documents.length === 0) {
    alert("Abre un archivo de moldes en Illustrator primero.");
    return;
  }
  var doc = app.activeDocument;
  var exportFile = File.saveDialog("Guardar SVG para HMB Entallador:", "*.svg");
  if (!exportFile) return;

  var svgOptions = new ExportOptionsSVG();
  svgOptions.embedRasterImages = true;
  svgOptions.fontSubsetting = SVGFontSubsetting.GLYPHSUSED;
  svgOptions.cssProperties = SVGCSSPropertyStyle.STYLEELEMENTS;
  svgOptions.documentEncoding = SVGDocumentEncoding.UTF8;
  svgOptions.coordinatePrecision = 4;
  doc.exportFile(exportFile, ExportType.SVG, svgOptions);
  alert("¡Molde exportado con éxito a escala 1:1!");
}
exportMoldesParaHmb();`;

    const blob = new Blob([scriptContent], { type: 'text/javascript;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'hmb_export_helper.jsx';
    link.click();
    URL.revokeObjectURL(url);
  };

  const submitManualAssignment = () => {
    if (!selectedPieceForAssignment) return;

    const rotations: number[] = [];
    if (rot0) rotations.push(0);
    if (rot90) rotations.push(90);
    if (rot180) rotations.push(180);
    if (rot270) rotations.push(270);

    assignPieceManually(
      selectedPieceForAssignment.id,
      assignSize,
      assignType,
      rotations.length > 0 ? rotations : [0]
    );
  };

  const currentSizeObj = activePatternSet?.sizes.find((s) => s.sizeName === activeSizeTab);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept=".svg"
        className="hidden"
        onChange={handleFileUpload}
      />


      {/* Main Pattern View or Empty State */}
      {!activePatternSet ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const file = e.dataTransfer.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
              const content = event.target?.result as string;
              if (content) {
                const setName = file.name.replace(/\.[^/.]+$/, '').toUpperCase();
                importSvg(content, setName, 'FUTBOL', file.name);
              }
            };
            reader.readAsText(file);
          }}
          className="bg-slate-900 border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-2xl p-16 text-center flex flex-col items-center justify-center cursor-pointer transition-all group"
        >
          <Scissors className="w-12 h-12 text-slate-600 group-hover:text-emerald-400 mb-3 transition-colors" />
          <h3 className="text-base font-semibold text-white">No hay conjunto de moldes activo</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md">
            Arrastra aquí tu archivo SVG de moldería graduada (ej: <span className="font-mono text-emerald-300">moldes 2025.svg</span>) exportado desde Illustrator o haz clic para seleccionarlo.
          </p>
          <button
            type="button"
            className="mt-5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-emerald-950 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Subir Mi Molde SVG
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Pattern Set Header Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              {patternSets.length > 1 && (
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-mono uppercase block">Conjunto Activo:</label>
                  <select
                    value={activePatternSet.id}
                    onChange={(e) => {
                      const found = patternSets.find((s) => s.id === e.target.value);
                      if (found) setActivePatternSet(found);
                    }}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-semibold"
                  >
                    {patternSets.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.sizes.length} tallas)
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                  <h3 className="text-base font-bold text-white tracking-wide">{activePatternSet.name}</h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {activePatternSet.sizes.length} tallas registradas •{' '}
                  {activePatternSet.sizes.reduce((acc, s) => acc + s.pieces.length, 0)} piezas asignadas
                  {activePatternSet.unassignedPieces.length > 0 && (
                    <span className="text-amber-400 ml-2 font-semibold">
                      • {activePatternSet.unassignedPieces.length} pieza(s) pendientes de asignar
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Action Buttons in single unified row */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleSavePatterns}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all ${
                  isSaved
                    ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                    : 'bg-sky-600 hover:bg-sky-500 text-white'
                }`}
                title="Guardar moldes de forma permanente"
              >
                {isSaved ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    ¡Moldes Guardados!
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    Guardar Moldes
                  </>
                )}
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 shadow-sm transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                Cargar Otro Molde SVG
              </button>
              <button
                onClick={handleDownloadScript}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
                title="Descargar script JSX para Adobe Illustrator"
              >
                <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                Script JSX
              </button>
              {patternSets.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm('¿Deseas eliminar todos los conjuntos de moldes cargados?')) {
                      clearAllPatterns();
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/30 hover:bg-red-900/50 text-red-300 rounded-lg text-xs font-medium border border-red-800/40 transition-colors"
                  title="Limpiar y borrar todos los moldes cargados"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  Limpiar Moldes
                </button>
              )}
              <button
                onClick={() => deletePatternSet(activePatternSet.id)}
                className="p-1.5 hover:bg-slate-800 text-slate-500 hover:text-red-400 rounded-lg transition-colors border border-transparent hover:border-slate-700"
                title="Eliminar este conjunto de moldes"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Unassigned Pieces Banner / Manual Assigner */}
          {activePatternSet.unassignedPieces.length > 0 && (
            <div className="bg-amber-950/20 border border-amber-800/40 rounded-xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Trazos Auxiliares: {activePatternSet.unassignedPieces.length} trazo(s) adicionales detectados en el archivo</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Tus moldes principales por talla ya fueron clasificados con éxito. Estos trazos no tenían talla escrita (ej. shorts, pretinas o líneas auxiliares).
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => discardAllUnassignedPieces()}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-700 transition-colors"
                    title="Descartar todos los trazos auxiliares si no los necesitas"
                  >
                    Descartar Todos ({activePatternSet.unassignedPieces.length})
                  </button>
                  {selectedPieceForAssignment && (
                    <button
                      onClick={() => discardUnassignedPiece(selectedPieceForAssignment.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/50 rounded-lg border border-red-900/50 transition-colors"
                      title="Descartar solo este trazo específico"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Descartar Trazo
                    </button>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                {/* Visual Thumbnail Preview */}
                <div className="flex items-center gap-3">
                  {selectedPieceForAssignment ? (
                    <div className="w-20 h-20 bg-slate-950 rounded-lg border border-slate-800 p-1 flex items-center justify-center flex-shrink-0">
                      {(() => {
                        const pathD = polygonToSvgPath(selectedPieceForAssignment.cutPolygon) || selectedPieceForAssignment.svgPathData;
                        const pad = Math.max(selectedPieceForAssignment.bbox.width, selectedPieceForAssignment.bbox.height) * 0.08;
                        const vbX = selectedPieceForAssignment.bbox.minX - pad;
                        const vbY = selectedPieceForAssignment.bbox.minY - pad;
                        const vbW = selectedPieceForAssignment.bbox.width + pad * 2;
                        const vbH = selectedPieceForAssignment.bbox.height + pad * 2;
                        return (
                          <svg
                            viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
                            preserveAspectRatio="xMidYMid meet"
                            className="w-full h-full text-amber-400 stroke-current fill-amber-500/10"
                          >
                            <path
                              d={pathD}
                              strokeWidth="1.5"
                              vectorEffect="non-scaling-stroke"
                              strokeLinejoin="round"
                              strokeLinecap="round"
                            />
                          </svg>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="w-20 h-20 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-center text-slate-600 text-xs flex-shrink-0">
                      Sin pieza
                    </div>
                  )}
                  <div className="space-y-1 flex-1">
                    <label className="text-xs text-slate-300 font-medium block">Pieza Detectada:</label>
                    <select
                      value={selectedPieceForAssignment?.id || ''}
                      onChange={(e) => {
                        const found = activePatternSet.unassignedPieces.find((p) => p.id === e.target.value);
                        selectPieceForAssignment(found || null);
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                    >
                      {activePatternSet.unassignedPieces.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.pieceName} ({(p.bbox.width / 10).toFixed(1)} × {(p.bbox.height / 10).toFixed(1)} cm)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Formulario de asignación */}
                <div className="grid grid-cols-2 gap-3 text-xs col-span-2">
                  <div>
                    <label className="text-slate-400 block mb-1">Asignar a Talla:</label>
                    <input
                      type="text"
                      value={assignSize}
                      onChange={(e) => setAssignSize(e.target.value.toUpperCase())}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold font-mono"
                      placeholder="28, 30, S, M"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Tipo de Pieza:</label>
                    <select
                      value={assignType}
                      onChange={(e) => setAssignType(e.target.value as PieceType)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 text-[11px]"
                    >
                      <option value="DELANTERO_V">DELANTERO (CUELLO V)</option>
                      <option value="DELANTERO_REDONDO">DELANTERO (CUELLO REDONDO)</option>
                      <option value="DELANTERO">DELANTERO (ESTÁNDAR)</option>
                      <option value="ESPALDA">ESPALDA</option>
                      <option value="MANGA_IZQ">MANGA IZQ</option>
                      <option value="MANGA_DER">MANGA DER</option>
                      <option value="CUELLO">CUELLO / RIB</option>
                      <option value="PANTALONETA_IZQ">PANTALONETA (LADO IZQ)</option>
                      <option value="PANTALONETA_DER">PANTALONETA (LADO DER)</option>
                      <option value="OTRO">OTRO / AUXILIAR</option>
                    </select>
                  </div>
                </div>

                {/* Botón de confirmar */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span>Rotaciones:</span>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" checked={rot0} onChange={(e) => setRot0(e.target.checked)} />
                      0°
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" checked={rot180} onChange={(e) => setRot180(e.target.checked)} />
                      180°
                    </label>
                  </div>
                  <button
                    onClick={submitManualAssignment}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Confirmar Asignación
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sizes & Pieces Explorer */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            {/* Size Tabs Header */}
            <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center gap-2 overflow-x-auto">
              <span className="text-xs font-medium text-slate-400 mr-2 flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-slate-500" /> Tallas:
              </span>
              {activePatternSet.sizes.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSizeTab(s.sizeName)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    activeSizeTab === s.sizeName
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  Talla {s.sizeName} ({s.pieces.length} pzs)
                </button>
              ))}
            </div>

            {/* Pieces Grid for Selected Size */}
            <div className="p-6">
              {currentSizeObj ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentSizeObj.pieces.map((piece) => (
                    <div
                      key={piece.id}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all space-y-3"
                    >
                      {/* Top Header of Card: Piece Type Selector and Delete Action */}
                      <div className="flex items-center justify-between gap-2">
                        <select
                          value={piece.pieceType}
                          onChange={(e) => updatePieceType(currentSizeObj.sizeName, piece.id, e.target.value as PieceType)}
                          className="flex-1 bg-slate-900 border border-slate-700 hover:border-emerald-500 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-emerald-400 focus:outline-none cursor-pointer transition-colors"
                          title="Cambiar tipo de pieza si fue clasificada incorrectamente"
                        >
                          <option value="DELANTERO_V">DELANTERO (CUELLO V)</option>
                          <option value="DELANTERO_REDONDO">DELANTERO (CUELLO REDONDO)</option>
                          <option value="DELANTERO">DELANTERO (ESTÁNDAR)</option>
                          <option value="ESPALDA">ESPALDA</option>
                          <option value="MANGA_IZQ">MANGA IZQ</option>
                          <option value="MANGA_DER">MANGA DER</option>
                          <option value="CUELLO">CUELLO / RIB</option>
                          <option value="PANTALONETA_IZQ">PANTALONETA (LADO IZQ)</option>
                          <option value="PANTALONETA_DER">PANTALONETA (LADO DER)</option>
                          <option value="OTRO">OTRO / AUX</option>
                        </select>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`¿Deseas omitir/eliminar la pieza "${piece.pieceName}" de la Talla ${currentSizeObj.sizeName}?`)) {
                              deletePieceFromSize(currentSizeObj.sizeName, piece.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-red-400 hover:bg-red-950/80 border border-slate-800 hover:border-red-800 transition-colors shrink-0"
                          title="Omitir o eliminar esta pieza si está de más o duplicada"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* SVG Thumbnail Mini Preview — 100% Unobstructed & Centered */}
                      <div className="h-40 bg-slate-900/60 rounded-lg flex items-center justify-center p-3 border border-slate-800/80 overflow-hidden">
                        {(() => {
                          const pathD = polygonToSvgPath(piece.cutPolygon) || piece.svgPathData;
                          const pad = Math.max(piece.bbox.width, piece.bbox.height) * 0.08;
                          const vbX = piece.bbox.minX - pad;
                          const vbY = piece.bbox.minY - pad;
                          const vbW = piece.bbox.width + pad * 2;
                          const vbH = piece.bbox.height + pad * 2;
                          return (
                            <svg
                              viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
                              preserveAspectRatio="xMidYMid meet"
                              className="h-full w-full max-h-36 text-emerald-400 stroke-current fill-emerald-500/10"
                            >
                              <path
                                d={pathD}
                                strokeWidth="1.5"
                                vectorEffect="non-scaling-stroke"
                                strokeLinejoin="round"
                                strokeLinecap="round"
                              />
                            </svg>
                          );
                        })()}
                      </div>

                      {/* Piece Metric Details in Centimeters (cm) */}
                      <div className="space-y-1 text-xs pt-1">
                        <div className="font-semibold text-white font-mono truncate">{piece.pieceName}</div>
                        <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
                          <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex items-center justify-between">
                            <span className="text-slate-400 text-[11px]">Ancho:</span>
                            <span className="text-emerald-400 font-bold text-xs">{(piece.bbox.width / 10).toFixed(1)} cm</span>
                          </div>
                          <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex items-center justify-between">
                            <span className="text-slate-400 text-[11px]">Alto:</span>
                            <span className="text-emerald-400 font-bold text-xs">{(piece.bbox.height / 10).toFixed(1)} cm</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-slate-500">
                  Selecciona una talla para inspeccionar sus piezas vectoriales
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
