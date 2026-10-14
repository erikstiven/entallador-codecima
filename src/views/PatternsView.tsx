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
  Loader2,
  Search,
  ArrowLeft,
  MoreVertical,
  Shapes,
  Clock,
  Tag,
  Grid
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
  const [catalogMode, setCatalogMode] = useState<'CATALOG' | 'DETAIL'>('CATALOG');
  const [catalogTab, setCatalogTab] = useState<'UPLOADS' | 'LIBRARY'>('UPLOADS');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const renderSilhouettePreview = (set: typeof patternSets[0]) => {
    const size = set.sizes[0];
    if (!size || size.pieces.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-300">
          <Scissors className="w-8 h-8" />
        </div>
      );
    }

    const pieces = size.pieces.slice(0, 4);
    const gap = 20;
    let currentX = 0;
    let maxHeight = 0;

    const pieceLayouts = pieces.map((p) => {
      const w = p.bbox?.width || 100;
      const h = p.bbox?.height || 100;
      if (h > maxHeight) maxHeight = h;
      const xOffset = currentX - (p.bbox?.minX || 0);
      const yOffset = -(p.bbox?.minY || 0);
      currentX += w + gap;
      const pathD = polygonToSvgPath(p.cutPolygon) || p.svgPathData || '';
      return { pathD, xOffset, yOffset, w, h };
    });

    const totalWidth = Math.max(currentX - gap, 100);
    const totalHeight = Math.max(maxHeight, 100);
    const pad = 25;

    return (
      <svg
        viewBox={`-${pad} -${pad} ${totalWidth + pad * 2} ${totalHeight + pad * 2}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full max-h-32 drop-shadow-2xs select-none pointer-events-none"
      >
        {pieceLayouts.map((layout, i) => (
          <g key={i} transform={`translate(${layout.xOffset}, ${layout.yOffset})`}>
            <path
              d={layout.pathD}
              fill="#0f172a"
              stroke="#0f172a"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        ))}
      </svg>
    );
  };

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
          setActivePatternSet(imported);
          setCatalogMode('DETAIL');
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

  const filteredSets = patternSets.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.garmentType && s.garmentType.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const LIBRARY_TEMPLATES = [
    {
      id: 'lib_futbol_v',
      name: 'Camiseta de fútbol Cuello V (XS - 2XL)',
      garmentType: 'Fútbol / Sublimación',
      pieceCount: 4,
      sizesCount: 6,
      date: '19 ago',
    },
    {
      id: 'lib_short_masc',
      name: 'Short deportivo masculino',
      garmentType: 'Deportivo / Atletismo',
      pieceCount: 2,
      sizesCount: 5,
      date: '25 may',
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept=".svg"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* VISTA 1: CATÁLOGO DE MOLDERÍAS (MODO SUBIMIFYER 1:1) */}
      {catalogMode === 'CATALOG' ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header del Catálogo */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/90 pb-4">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Catálogo de molderías
              </h2>

              {/* Segmented Control: Subidas | Biblioteca */}
              <div className="bg-slate-100 p-0.5 rounded-lg border border-slate-200/80 flex items-center text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setCatalogTab('UPLOADS')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    catalogTab === 'UPLOADS'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Subidas
                </button>
                <button
                  type="button"
                  onClick={() => setCatalogTab('LIBRARY')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    catalogTab === 'LIBRARY'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Biblioteca
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImportingSvg}
                className="rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs px-4 py-2 font-semibold inline-flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isImportingSvg ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Analizando vectores...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Subir moldería</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownloadTemplate}
                disabled={!activePatternSet && patternSets.length === 0}
                className="rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs px-4 py-2 font-semibold inline-flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer disabled:opacity-40"
                title="Descargar plantilla de Illustrator"
              >
                <Download className="w-3.5 h-3.5 text-violet-600" />
                <span className="hidden sm:inline">Descargar plantilla</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadScript}
                className="rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs px-4 py-2 font-semibold inline-flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer"
                title="Descargar script JSX para Illustrator"
              >
                <FileCode className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Script JSX</span>
              </button>
            </div>
          </div>

          {/* Barra de Búsqueda y Filtros */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-violet-500 shadow-2xs font-medium"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 shadow-2xs cursor-pointer transition-colors"
                title="Historial de recientes"
              >
                <Clock className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 shadow-2xs cursor-pointer transition-colors"
                title="Filtrar por etiqueta"
              >
                <Tag className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sección "Inicio" */}
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
            Inicio
          </div>

          {/* Grid de Tarjetas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {catalogTab === 'UPLOADS' ? (
              <>
                {filteredSets.map((set) => {
                  const totalPieces = set.sizes.reduce((acc, s) => acc + s.pieces.length, 0);
                  const isCurrentActive = activePatternSet?.id === set.id;
                  const isMenuOpen = activeMenuId === set.id;

                  return (
                    <div
                      key={set.id}
                      onClick={() => {
                        setActivePatternSet(set);
                        setCatalogMode('DETAIL');
                      }}
                      className={`bg-white rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between group hover:shadow-md ${
                        isCurrentActive 
                          ? 'border-violet-400 ring-2 ring-violet-200 shadow-xs' 
                          : 'border-slate-200/80 hover:border-violet-300 shadow-2xs'
                      }`}
                    >
                      {/* Silhouette Preview Area */}
                      <div className="h-44 bg-slate-100/70 p-3.5 flex items-center justify-center relative border-b border-slate-100 group-hover:bg-slate-100 transition-colors">
                        {renderSilhouettePreview(set)}

                        {/* 3 dots menu button */}
                        <div 
                          className="absolute top-2.5 right-2.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => setActiveMenuId(isMenuOpen ? null : set.id)}
                            className="p-1 rounded-lg bg-white/90 hover:bg-white text-slate-500 hover:text-slate-900 shadow-2xs border border-slate-200/60 transition-colors cursor-pointer"
                            title="Opciones de moldería"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {isMenuOpen && (
                            <div 
                              className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-30 animate-in fade-in zoom-in-95 duration-100 text-xs"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setActivePatternSet(set);
                                  setCatalogMode('DETAIL');
                                }}
                                className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-2 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-violet-600" />
                                <span>Ver y editar piezas</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setActivePatternSet(set);
                                  handleDownloadTemplate();
                                }}
                                className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-2 cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5 text-slate-500" />
                                <span>Descargar plantilla</span>
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  setActiveMenuId(null);
                                  const confirmed = await showAlert.confirm(
                                    '¿Eliminar este molde?',
                                    `Se eliminará el molde "${set.name}".`
                                  );
                                  if (confirmed) {
                                    deletePatternSet(set.id);
                                    showAlert.toast('info', 'Molde eliminado');
                                  }
                                }}
                                className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 font-medium flex items-center gap-2 border-t border-slate-100 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Eliminar molde</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-3.5 space-y-2">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-violet-700 transition-colors">
                            {set.name}
                          </h4>
                          <div className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                            {set.garmentType || 'Sin etiquetas'}
                          </div>
                        </div>

                        {/* Footer Stats Row: pieces, sizes, date */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
                          <div className="flex items-center gap-2.5">
                            <span className="flex items-center gap-1" title="Total de piezas clasificadas">
                              <Shapes className="w-3.5 h-3.5 text-slate-400" />
                              <strong className="text-slate-600 font-mono">{totalPieces}</strong>
                            </span>
                            <span className="flex items-center gap-1" title="Total de tallas">
                              <Grid className="w-3.5 h-3.5 text-slate-400" />
                              <strong className="text-slate-600 font-mono">{set.sizes.length}</strong>
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {set.createdAt ? new Date(set.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : 'Reciente'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Card para Subir Moldería */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-slate-50/70 border-2 border-dashed border-slate-200 hover:border-violet-400 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all group hover:bg-violet-50/20 min-h-[220px]"
                >
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 group-hover:text-violet-600 group-hover:border-violet-300 flex items-center justify-center mb-2 shadow-2xs group-hover:scale-105 transition-all">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-slate-700 group-hover:text-violet-700 transition-colors">
                    Subir moldería SVG
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 max-w-[160px]">
                    Arrastra un archivo exportado de Illustrator
                  </div>
                </div>
              </>
            ) : (
              /* Biblioteca Tab */
              LIBRARY_TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:border-violet-300 hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
                >
                  <div className="h-44 bg-slate-100/70 p-3.5 flex items-center justify-center border-b border-slate-100">
                    <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-violet-600 shadow-2xs">
                      <Scissors className="w-8 h-8" />
                    </div>
                  </div>
                  <div className="p-3.5 space-y-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {tmpl.name}
                      </h4>
                      <div className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                        {tmpl.garmentType}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
                      <div className="flex items-center gap-2.5">
                        <span className="flex items-center gap-1">
                          <Shapes className="w-3.5 h-3.5 text-slate-400" />
                          <strong className="text-slate-600 font-mono">{tmpl.pieceCount}</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <Grid className="w-3.5 h-3.5 text-slate-400" />
                          <strong className="text-slate-600 font-mono">{tmpl.sizesCount}</strong>
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">{tmpl.date}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* VISTA 2: DETALLE E INSPECTOR DE MOLDERÍA ACTIVA */
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Top Breadcrumb Header para Volver al Catálogo */}
          <div className="flex items-center justify-between gap-3 border-b border-slate-200/90 pb-3">
            <button
              type="button"
              onClick={() => setCatalogMode('CATALOG')}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-semibold shadow-2xs active:scale-95 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-violet-600" />
              <span>Volver al catálogo de molderías</span>
            </button>

            {activePatternSet && (
              <div className="text-xs text-slate-500 font-medium">
                Moldería: <strong className="text-slate-900 font-bold">{activePatternSet.name}</strong>
              </div>
            )}
          </div>

          {!activePatternSet ? (
            <div className="text-center py-12 text-xs text-slate-500">
              No hay molde seleccionado.{' '}
              <button
                type="button"
                onClick={() => setCatalogMode('CATALOG')}
                className="text-violet-600 underline font-semibold ml-1 cursor-pointer"
              >
                Ir al catálogo
              </button>
            </div>
          ) : (
            <>
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
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-50"
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
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 shadow-2xs active:scale-95 transition-all cursor-pointer"
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
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs active:scale-95 transition-all cursor-pointer"
                    title="Descargar plantilla editable con capas para Adobe Illustrator"
                  >
                    <Download className="w-3.5 h-3.5 text-violet-600" />
                    <span>Descargar Plantilla Illustrator</span>
                  </button>

                  <button
                    onClick={handleDownloadScript}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 shadow-2xs active:scale-95 transition-all cursor-pointer"
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
                        setCatalogMode('CATALOG');
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-lg text-xs font-semibold border border-slate-200 hover:border-red-200 shadow-2xs active:scale-95 transition-all cursor-pointer"
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
                            setCatalogMode('CATALOG');
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
            </>
          )}
        </div>
      )}
    </div>
  );
};
