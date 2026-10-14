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
  Save,
  LayoutGrid,
  Table,
  Loader2
} from 'lucide-react';
import { usePatternStore } from '@/modules/patterns/patternStore';
import { PieceType, PatternPiece } from '@/modules/patterns/types';
import { polygonToSvgPath } from '@/core/geometry/transform';
import { showAlert } from '@/core/ui/alerts';
import { dbService } from '@/core/database/db';
import { generateIllustratorTemplateSvg } from '@/modules/patterns/patternTemplateExporter';

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
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isImportingSvg, setIsImportingSvg] = useState<boolean>(false);
  const [importSummaryMsg, setImportSummaryMsg] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE'>('CARDS');

  const handleSavePatterns = async () => {
    if (!activePatternSet || isSaving) return;
    setIsSaving(true);
    setIsSaved(false);
    try {
      saveActiveSet();
      await dbService.persistBrowserDb();
      const totalPieces = activePatternSet.sizes.reduce((acc, s) => acc + s.pieces.length, 0);
      setIsSaving(false);
      setIsSaved(true);
      showAlert.toast(
        'success',
        `Molde '${activePatternSet.name}' guardado correctamente con ${totalPieces} piezas`
      );
      setTimeout(() => setIsSaved(false), 2500);
    } catch (err) {
      console.error('Error guardando molde:', err);
      setIsSaving(false);
      showAlert.error('Error al Guardar', 'No se pudo guardar el molde en la base de datos.');
    }
  };

  // Formulario de asignación manual
  const [assignSize, setAssignSize] = useState<string>('28');
  const [assignType, setAssignType] = useState<PieceType>('DELANTERO');
  const [rot0, setRot0] = useState<boolean>(true);
  const [rot90, setRot90] = useState<boolean>(false);
  const [rot180, setRot180] = useState<boolean>(false);
  const [rot270, setRot270] = useState<boolean>(false);

  useEffect(() => {
    if (patternSets.length === 0) {
      loadFromDatabase();
    }
  }, []);

  useEffect(() => {
    if (activePatternSet && activePatternSet.sizes.length > 0 && !activeSizeTab) {
      setActiveSizeTab(activePatternSet.sizes[0].sizeName);
    }
  }, [activePatternSet]);

  const processPatternSvgFile = (file: File) => {
    setIsImportingSvg(true);
    setImportSummaryMsg(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        if (content) {
          await new Promise((resolve) => setTimeout(resolve, 60));
          const setName = file.name.replace(/\.[^/.]+$/, '').toUpperCase();
          const imported = importSvg(content, setName, 'FUTBOL', file.name);
          await dbService.persistBrowserDb();
          const assignedCount = imported.sizes.reduce((acc, s) => acc + s.pieces.length, 0);
          const unassignedCount = imported.unassignedPieces.length;
          const totalPieces = assignedCount + unassignedCount;
          const summaryText = `Se detectaron ${totalPieces} piezas en el molde "${imported.name}" (${assignedCount} clasificadas en ${imported.sizes.length} tallas${unassignedCount > 0 ? ` y ${unassignedCount} trazos auxiliares` : ''}).`;
          setImportSummaryMsg(summaryText);
          showAlert.toast('success', summaryText);
          if (imported.sizes.length > 0) {
            setActiveSizeTab(imported.sizes[0].sizeName);
          }
        }
      } catch (err) {
        console.error('Error importando SVG de molde:', err);
        showAlert.error('Error al importar SVG', 'No se pudieron analizar los vectores del archivo seleccionado.');
      } finally {
        setIsImportingSvg(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.onerror = () => {
      setIsImportingSvg(false);
      showAlert.error('Error de lectura', 'No se pudo leer el archivo SVG seleccionado.');
    };
    reader.readAsText(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processPatternSvgFile(file);
  };



  const handleDownloadScript = () => {
    const scriptContent = `/**
 * CIMATEX — SCRIPT PARA ADOBE ILLUSTRATOR
 */
#target illustrator
function exportMoldesParaCimatex() {
  if (app.documents.length === 0) {
    alert("Abre un archivo de moldes en Illustrator primero.");
    return;
  }
  var doc = app.activeDocument;
  var exportFile = File.saveDialog("Guardar SVG para CimaTex:", "*.svg");
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
exportMoldesParaCimatex();`;

    const blob = new Blob([scriptContent], { type: 'text/javascript;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cimatex_export_helper.jsx';
    link.click();
    URL.revokeObjectURL(url);
    showAlert.toast('success', 'Script JSX para Illustrator descargado con éxito');
  };

  const handleDownloadTemplate = () => {
    if (!activePatternSet) return;
    const svgContent = generateIllustratorTemplateSvg(activePatternSet);
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeName = activePatternSet.name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
    link.download = `PLANTILLA_MOLDES_${safeName}_1A1.svg`;
    link.click();
    URL.revokeObjectURL(url);
    showAlert.toast('success', 'Plantilla SVG editable para Illustrator descargada con éxito.');
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
          onClick={() => {
            if (!isImportingSvg) fileInputRef.current?.click();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isImportingSvg) return;
            const file = e.dataTransfer.files?.[0];
            if (!file) return;
            processPatternSvgFile(file);
          }}
          className="bg-slate-50/60 border-2 border-dashed border-slate-300 hover:border-violet-400 rounded-xl p-16 text-center flex flex-col items-center justify-center cursor-pointer transition-all group shadow-2xs"
        >
          <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 text-slate-500 group-hover:text-violet-600 group-hover:border-violet-300 flex items-center justify-center mb-3 group-hover:scale-105 transition-all shadow-xs">
            <Scissors className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800 group-hover:text-violet-700 transition-colors">
            No hay conjunto de moldes activo
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md">
            Arrastra aquí tu archivo SVG de moldería graduada exportado desde Illustrator o haz clic para seleccionarlo.
          </p>
          <button
            type="button"
            disabled={isImportingSvg}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            {isImportingSvg ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analizando vectores del molde...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Subir Mi Molde SVG</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Active Pattern Set Header Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              {patternSets.length > 1 && (
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-mono uppercase font-bold block">Conjunto Activo:</label>
                  <select
                    value={activePatternSet.id}
                    onChange={(e) => {
                      const found = patternSets.find((s) => s.id === e.target.value);
                      if (found) setActivePatternSet(found);
                    }}
                    className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-medium shadow-2xs"
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
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-violet-600" />
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">{activePatternSet.name}</h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activePatternSet.sizes.length} tallas registradas •{' '}
                  {activePatternSet.sizes.reduce((acc, s) => acc + s.pieces.length, 0)} piezas asignadas
                  {activePatternSet.unassignedPieces.length > 0 && (
                    <span className="text-amber-700 ml-2 font-medium">
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
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                title="Guardar molde de forma permanente"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Guardando molde...</span>
                  </>
                ) : isSaved ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>¡Molde Guardado!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Guardar Molde</span>
                  </>
                )}
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isImportingSvg}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 rounded-lg text-xs font-medium border border-slate-200 shadow-xs transition-colors cursor-pointer"
              >
                {isImportingSvg ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 text-violet-600 animate-spin" />
                    <span>Analizando vectores...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5 text-violet-600" />
                    <span>Cargar Otro Molde SVG</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-lg text-xs font-medium shadow-xs transition-colors cursor-pointer"
                title="Descargar plantilla editable con capas para Adobe Illustrator"
              >
                <Download className="w-3.5 h-3.5 text-violet-600" />
                <span>Descargar Plantilla Illustrator</span>
              </button>

              <button
                onClick={handleDownloadScript}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium border border-slate-200 shadow-xs transition-colors cursor-pointer"
                title="Descargar script JSX para Adobe Illustrator"
              >
                <FileCode className="w-3.5 h-3.5 text-slate-500" />
                <span>Script JSX</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  const confirmed = await showAlert.confirm(
                    '¿Eliminar este molde?',
                    `Se eliminará el conjunto "${activePatternSet.name}".`
                  );
                  if (confirmed) {
                    deletePatternSet(activePatternSet.id);
                    showAlert.toast('info', 'Conjunto de moldes eliminado');
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-lg text-xs font-medium border border-slate-200 hover:border-red-200 shadow-xs transition-colors cursor-pointer"
                title="Eliminar este conjunto de moldes activo"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar Molde</span>
              </button>

              {patternSets.length > 0 && (
                <div className="flex items-center pl-2 ml-1 border-l border-slate-200">
                  <button
                    type="button"
                    onClick={async () => {
                      const confirmed = await showAlert.confirm(
                        '¿Limpiar TODOS los moldes de la biblioteca?',
                        '¡ADVERTENCIA DE SEGURIDAD! Esta acción administrativa eliminará permanentemente todos los conjuntos de moldes guardados en la base de datos local. ¿Estás completamente seguro?'
                      );
                      if (confirmed) {
                        clearAllPatterns();
                        showAlert.toast('info', 'Biblioteca de moldes vaciada por completo');
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg text-xs font-medium border border-slate-200 hover:border-red-200 transition-colors cursor-pointer"
                    title="Acción administrativa: Limpiar toda la biblioteca de moldes"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Limpiar Moldes (Todos)</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Import Detection Summary Banner */}
          {importSummaryMsg && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5 text-xs text-emerald-800 font-semibold">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{importSummaryMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setImportSummaryMsg(null)}
                className="text-[11px] text-emerald-700 hover:text-emerald-900 font-mono px-2 py-0.5 rounded hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          )}

          {/* Unassigned Pieces Banner / Manual Assigner */}
          {activePatternSet.unassignedPieces.length > 0 && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-5 space-y-4 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Trazos Auxiliares: {activePatternSet.unassignedPieces.length} trazo(s) adicionales detectados en el archivo</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Tus moldes principales por talla ya fueron clasificados con éxito. Estos trazos no tenían talla escrita (ej. shorts, pretinas o líneas auxiliares).
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => discardAllUnassignedPieces()}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 shadow-2xs transition-colors cursor-pointer font-medium"
                    title="Descartar todos los trazos auxiliares si no los necesitas"
                  >
                    Descartar Todos ({activePatternSet.unassignedPieces.length})
                  </button>
                  {selectedPieceForAssignment && (
                    <button
                      type="button"
                      onClick={() => discardUnassignedPiece(selectedPieceForAssignment.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-600 hover:text-red-700 bg-white hover:bg-red-50 rounded-lg border border-red-200 shadow-2xs transition-colors cursor-pointer font-medium"
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
                    <div className="w-20 h-20 bg-slate-50 rounded-lg border border-slate-200 p-1 flex items-center justify-center flex-shrink-0 shadow-inner">
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
                            className="w-full h-full text-amber-600 stroke-current fill-amber-500/10"
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
                    <div className="w-20 h-20 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 text-xs flex-shrink-0">
                      Sin pieza
                    </div>
                  )}
                  <div className="space-y-1 flex-1">
                    <label className="text-xs text-slate-700 font-medium block">Pieza Detectada:</label>
                    <select
                      value={selectedPieceForAssignment?.id || ''}
                      onChange={(e) => {
                        const found = activePatternSet.unassignedPieces.find((p) => p.id === e.target.value);
                        selectPieceForAssignment(found || null);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-mono shadow-2xs focus:border-violet-500 focus:outline-none"
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
                    <label className="text-slate-700 font-medium block mb-1">Asignar a Talla:</label>
                    <input
                      type="text"
                      value={assignSize}
                      onChange={(e) => setAssignSize(e.target.value.toUpperCase())}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 font-bold font-mono shadow-2xs focus:border-violet-500 focus:outline-none"
                      placeholder="28, 30, S, M"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 font-medium block mb-1">Tipo de Pieza:</label>
                    <select
                      value={assignType}
                      onChange={(e) => setAssignType(e.target.value as PieceType)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-800 text-[11px] shadow-2xs focus:border-violet-500 focus:outline-none"
                    >
                      <option value="DELANTERO_V">DELANTERO (CUELLO V)</option>
                      <option value="DELANTERO_REDONDO">DELANTERO (CUELLO REDONDO)</option>
                      <option value="DELANTERO">DELANTERO (ESTÁNDAR)</option>
                      <option value="ESPALDA">ESPALDA</option>
                      <option value="MANGA_IZQ">MANGA (CORTA / SIMÉTRICA)</option>
                      <option value="MANGA_DER">MANGA DER (SI ES DISTINTA)</option>
                      <option value="CUELLO">CUELLO / RIB</option>
                      <option value="PANTALONETA_IZQ">PANTALONETA (PIERNA / ESPEJO)</option>
                      <option value="PANTALONETA_DER">PANTALONETA DER (SI ES DISTINTA)</option>
                      <option value="OTRO">OTRO / AUXILIAR</option>
                    </select>
                  </div>
                </div>

                {/* Botón de confirmar */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3 text-[11px] text-slate-600 font-medium">
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
                    type="button"
                    onClick={submitManualAssignment}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Confirmar Asignación
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sizes & Pieces Explorer */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            {/* Size Tabs Header & View Mode Switcher */}
            <div className="p-3 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 overflow-x-auto py-0.5">
                {viewMode === 'CARDS' ? (
                  <>
                    <span className="text-xs font-medium text-slate-500 mr-1 flex items-center gap-1">
                      <Sliders className="w-3.5 h-3.5 text-slate-400" /> Tallas:
                    </span>
                    {activePatternSet.sizes.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setActiveSizeTab(s.sizeName)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                          activeSizeTab === s.sizeName
                            ? 'bg-violet-600 text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-100/60'
                        }`}
                      >
                        Talla {s.sizeName} ({s.pieces.length} pzs)
                      </button>
                    ))}
                  </>
                ) : (
                  <span className="text-xs font-semibold text-slate-800 flex items-center gap-2">
                    <Table className="w-4 h-4 text-violet-600" />
                    Tabla de Moldes y Graduación (Medidas en cm)
                  </span>
                )}
              </div>

              {/* View Switcher: Siluetas vs Tabla de Moldes */}
              <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 p-1 rounded-lg shrink-0">
                <button
                  onClick={() => setViewMode('CARDS')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === 'CARDS'
                      ? 'bg-white text-violet-700 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Ver piezas gráficas con siluetas vectoriales"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  Siluetas
                </button>
                <button
                  onClick={() => setViewMode('TABLE')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === 'TABLE'
                      ? 'bg-white text-violet-700 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Ver tabla comparativa con medidas de todas las tallas"
                >
                  <Table className="w-3.5 h-3.5" />
                  Tabla de Moldes
                </button>
              </div>
            </div>

            {/* Pieces Grid for Selected Size OR Full Graduation Table */}
            <div className="p-6">
              {viewMode === 'TABLE' ? (
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-mono border-b border-slate-200 text-[11px] uppercase">
                      <tr>
                        <th className="py-3 px-4">Talla</th>
                        <th className="py-3 px-4">Delantero</th>
                        <th className="py-3 px-4">Espalda</th>
                        <th className="py-3 px-4">Manga</th>
                        <th className="py-3 px-4">Pantaloneta</th>
                        <th className="py-3 px-4">Cuello / Rib</th>
                        <th className="py-3 px-4 text-center">Total Piezas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono bg-white">
                      {activePatternSet.sizes.map((size) => {
                        const delantero = size.pieces.find((p) => p.pieceType.includes('DELANTERO'));
                        const espalda = size.pieces.find((p) => p.pieceType === 'ESPALDA');
                        const manga = size.pieces.find((p) => p.pieceType.includes('MANGA'));
                        const shortP = size.pieces.find((p) => p.pieceType.includes('PANTALONETA') || p.pieceType.includes('SHORT'));
                        const cuello = size.pieces.find((p) => p.pieceType === 'CUELLO');

                        return (
                          <tr key={size.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-4 font-bold text-violet-700 text-sm">
                              Talla {size.sizeName}
                            </td>
                            <td className="py-3 px-4 text-slate-800">
                              {delantero ? (
                                <span className="bg-slate-50 border border-slate-200 px-2 py-1 rounded-md">
                                  {(delantero.bbox.width / 10).toFixed(1)} × {(delantero.bbox.height / 10).toFixed(1)} cm
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-slate-800">
                              {espalda ? (
                                <span className="bg-slate-50 border border-slate-200 px-2 py-1 rounded-md">
                                  {(espalda.bbox.width / 10).toFixed(1)} × {(espalda.bbox.height / 10).toFixed(1)} cm
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-slate-800">
                              {manga ? (
                                <span className="bg-slate-50 border border-slate-200 px-2 py-1 rounded-md">
                                  {(manga.bbox.width / 10).toFixed(1)} × {(manga.bbox.height / 10).toFixed(1)} cm
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-slate-800">
                              {shortP ? (
                                <span className="bg-slate-50 border border-slate-200 px-2 py-1 rounded-md">
                                  {(shortP.bbox.width / 10).toFixed(1)} × {(shortP.bbox.height / 10).toFixed(1)} cm
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-slate-800">
                              {cuello ? (
                                <span className="bg-slate-50 border border-slate-200 px-2 py-1 rounded-md">
                                  {(cuello.bbox.width / 10).toFixed(1)} × {(cuello.bbox.height / 10).toFixed(1)} cm
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="bg-violet-50 border border-violet-200 text-violet-700 px-2.5 py-1 rounded-md text-xs font-bold">
                                {size.pieces.length} pzs
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : currentSizeObj ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentSizeObj.pieces.map((piece) => (
                    <div
                      key={piece.id}
                      className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:border-violet-300 hover:shadow-xs transition-all space-y-3"
                    >
                      {/* Top Header of Card: Piece Type Selector and Delete Action */}
                      <div className="flex items-center justify-between gap-2">
                        <select
                          value={piece.pieceType}
                          onChange={(e) => updatePieceType(currentSizeObj.sizeName, piece.id, e.target.value as PieceType)}
                          className="flex-1 bg-white border border-slate-200 hover:border-violet-400 focus:border-violet-600 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-violet-900 focus:outline-none cursor-pointer transition-colors"
                          title="Cambiar tipo de pieza si fue clasificada incorrectamente"
                        >
                          <option value="DELANTERO_V">DELANTERO (CUELLO V)</option>
                          <option value="DELANTERO_REDONDO">DELANTERO (CUELLO REDONDO)</option>
                          <option value="DELANTERO">DELANTERO (ESTÁNDAR)</option>
                          <option value="ESPALDA">ESPALDA</option>
                          <option value="MANGA_IZQ">MANGA (CORTA / SIMÉTRICA)</option>
                          <option value="MANGA_DER">MANGA DER (SI ES DISTINTA)</option>
                          <option value="CUELLO">CUELLO / RIB</option>
                          <option value="PANTALONETA_IZQ">PANTALONETA (PIERNA / ESPEJO)</option>
                          <option value="PANTALONETA_DER">PANTALONETA DER (SI ES DISTINTA)</option>
                          <option value="OTRO">OTRO / AUX</option>
                        </select>

                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            const confirmed = await showAlert.confirm(
                              '¿Eliminar pieza del molde?',
                              `¿Deseas omitir la pieza "${piece.pieceName}" de la Talla ${currentSizeObj.sizeName}?`
                            );
                            if (confirmed) {
                              deletePieceFromSize(currentSizeObj.sizeName, piece.id);
                              showAlert.toast('info', 'Pieza eliminada');
                            }
                          }}
                          className="p-1.5 rounded-lg bg-white text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 transition-colors shrink-0 cursor-pointer"
                          title="Omitir o eliminar esta pieza si está de más o duplicada"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* SVG Thumbnail Mini Preview — 100% Unobstructed & Centered */}
                      <div className="h-40 bg-slate-50 rounded-lg flex items-center justify-center p-3 border border-slate-200/80 overflow-hidden">
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
                              className="h-full w-full max-h-36 text-violet-600 stroke-current fill-violet-500/10"
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
                        <div className="font-semibold text-slate-900 font-mono truncate">{piece.pieceName}</div>
                        <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
                          <div className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 flex items-center justify-between">
                            <span className="text-slate-500 text-[11px]">Ancho:</span>
                            <span className="text-slate-900 font-bold text-xs">{(piece.bbox.width / 10).toFixed(1)} cm</span>
                          </div>
                          <div className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 flex items-center justify-between">
                            <span className="text-slate-500 text-[11px]">Alto:</span>
                            <span className="text-slate-900 font-bold text-xs">{(piece.bbox.height / 10).toFixed(1)} cm</span>
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
