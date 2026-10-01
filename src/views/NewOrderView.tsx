import React, { useRef, useEffect } from 'react';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Trash2, 
  Plus, 
  Download, 
  ArrowRight,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Zap,
  Layers,
  FileCheck,
  Shirt,
  Scissors
} from 'lucide-react';
import { useOrderStore } from '@/modules/orders/orderStore';
import { useProfileStore } from '@/modules/settings/profileStore';
import { useNavigationStore } from '@/modules/navigation/navigationStore';
import { GarmentType } from '@/modules/orders/types';
import { generateOrderTemplateWorkbook } from '@/modules/orders/excelParser';
import { useGeneratorStore } from '@/modules/generator/generatorStore';
import { usePatternStore } from '@/modules/patterns/patternStore';
import { useDesignStore } from '@/modules/designs/designStore';

export const NewOrderView: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { activeProfile } = useProfileStore();
  const { setCurrentView } = useNavigationStore();
  const { activePatternSet, patternSets, loadFromDatabase, setActivePatternSet } = usePatternStore();
  const { activeDesign, designs, loadDesignsFromDatabase, setActiveDesign } = useDesignStore();

  useEffect(() => {
    loadFromDatabase();
    loadDesignsFromDatabase();
  }, []);

  const currentPatternSet = activePatternSet || patternSets[0] || null;
  const currentDesign = activeDesign || designs[0] || null;

  const {
    items,
    summary,
    fileName,
    clientName,
    teamName,
    sport,
    setClientName,
    setTeamName,
    setSport,
    loadFromBuffer,
    updateItem,
    removeItem,
    addItem,
    clearOrder,
    setAllGarmentTypes,
  } = useOrderStore();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      if (buffer) {
        loadFromBuffer(buffer, file.name);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      if (buffer) {
        loadFromBuffer(buffer, file.name);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDownloadTemplate = () => {
    const uint8 = generateOrderTemplateWorkbook();
    const blob = new Blob([uint8.buffer as ArrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'plantilla_pedido_uniformes.xlsx';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 text-slate-200">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Hero Welcome Banner (Solo cuando aún no hay archivo cargado) */}
      {items.length === 0 && (
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Importación Industrial</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                Cargar Nómina del Pedido
              </h2>
              <p className="text-xs md:text-sm text-slate-400 max-w-2xl leading-relaxed">
                Importa el archivo Excel de tu cliente con nombres, números y tallas. El motor validará caracteres especiales (tildes/ñ) y calculará las piezas de corte al milímetro.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleDownloadTemplate}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                title="Descargar archivo Excel con formato listo para llenar"
              >
                <Download className="w-4 h-4 text-purple-400" />
                <span>Descargar Plantilla (.xlsx)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drag & Drop Zone (if no items loaded) */}
      {items.length === 0 ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="relative overflow-hidden border-2 border-dashed border-slate-700/80 hover:border-purple-500/80 bg-slate-900/40 hover:bg-slate-900/70 transition-all duration-300 rounded-3xl p-16 text-center flex flex-col items-center justify-center cursor-pointer group shadow-xl"
        >
          <div className="w-20 h-20 rounded-3xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-purple-500/20 transition-all duration-300 shadow-lg shadow-purple-950/40">
            <UploadCloud className="w-10 h-10" />
          </div>
          <h4 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
            Arrastra tu archivo Excel aquí o haz clic para seleccionar
          </h4>
          <p className="text-xs text-slate-400 mt-2 max-w-md leading-relaxed">
            Formatos compatibles: <span className="text-purple-400 font-mono font-semibold">.xlsx</span>, <span className="text-purple-400 font-mono font-semibold">.xls</span> y <span className="text-purple-400 font-mono font-semibold">.csv</span>
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <button 
              type="button"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-extrabold shadow-xl shadow-purple-950/60 transition-all flex items-center gap-2 active:scale-95 cursor-pointer ring-1 ring-purple-400/30"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Explorar Archivo en mi PC
            </button>
          </div>

          {/* Feature Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-10 pt-8 border-t border-slate-800/80 w-full max-w-2xl text-[11px] text-slate-400">
            <div className="flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Soporte Tildes y Eñes (UTF-8)</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Zap className="w-4 h-4 text-sky-400" />
              <span>Validación Automática Instantánea</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Multi-Talla Niño y Adulto</span>
            </div>
          </div>
        </div>
      ) : (
        /* Order Items Table & Real-time Validation */
        <div className="space-y-4">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg backdrop-blur-md">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Jugadores</div>
              <div className="text-2xl font-black font-mono text-white mt-1">{summary.totalItems}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">En la nómina activa</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg backdrop-blur-md">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Piezas a Producir</div>
              <div className="text-2xl font-black font-mono text-sky-400 mt-1">
                {summary.totalPiecesCount} <span className="text-xs font-semibold text-slate-400">piezas</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Frente, espalda, mangas y shorts</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg backdrop-blur-md">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Validación de Nómina</div>
              {summary.invalidCount > 0 ? (
                <div className="text-2xl font-black font-mono text-red-400 mt-1 flex items-center gap-1.5">
                  <AlertCircle className="w-5 h-5" />
                  {summary.invalidCount} Error(es)
                </div>
              ) : (
                <div className="text-2xl font-black font-mono text-purple-400 mt-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-5 h-5" />
                  100% Correcto
                </div>
              )}
              <div className="text-[10px] text-slate-400 mt-0.5">{summary.validCount} de {summary.totalItems} listos</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg backdrop-blur-md flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Archivo Excel</div>
                <div className="text-xs text-white font-mono font-bold truncate mt-1" title={fileName || ''}>
                  {fileName || 'pedido.xlsx'}
                </div>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-[11px] text-purple-400 hover:text-purple-300 font-bold text-left mt-2 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Reemplazar Excel
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">Nómina del Pedido</span>
                  <span className="text-xs text-slate-400 font-mono">({items.length} jugadores)</span>
                </div>

                {/* Selector Rápido de Producción */}
                <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5 text-xs">
                  <span className="text-[10px] uppercase font-mono text-slate-400 px-2 font-bold">Producción:</span>
                  <button
                    type="button"
                    onClick={() => setAllGarmentTypes('CAMISETA')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      items.length > 0 && items.every((i) => i.garmentType === 'CAMISETA')
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Cambiar todo el pedido a solo camisetas (Frente, Espalda y Mangas)"
                  >
                    <Shirt className="w-3.5 h-3.5" />
                    Solo Camisetas
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllGarmentTypes('SHORT')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      items.length > 0 && items.every((i) => i.garmentType === 'SHORT')
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Cambiar todo el pedido a solo shorts"
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    Solo Shorts
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllGarmentTypes('COMPLETO')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      items.length > 0 && items.every((i) => i.garmentType === 'COMPLETO')
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Conjunto completo (Camiseta + Short)"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Completo (6 pzs)
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => addItem({ playerName: 'NUEVO', playerNumber: '00', sizeName: '28', garmentType: 'CAMISETA' })}
                  className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-950 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agregar Jugador
                </button>
              </div>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 sticky top-0 border-b border-slate-800 z-10 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3 w-12 text-center">#</th>
                    <th className="py-3 px-3 w-28">Talla</th>
                    <th className="py-3 px-3">Nombre Dorsal</th>
                    <th className="py-3 px-3 w-24">Número</th>
                    <th className="py-3 px-3 w-36">Tipo Prenda</th>
                    <th className="py-3 px-3">Validación / Estado</th>
                    <th className="py-3 px-3 w-12 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300">
                  {items.map((item, idx) => (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-slate-800/40 transition-colors ${
                        !item.isValid ? 'bg-red-950/20' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center text-slate-400 font-bold" title={`Fila Excel: ${item.rowNumber}`}>{idx + 1}</td>
                      
                      {/* Editable Size */}
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={item.sizeName}
                          onChange={(e) => updateItem(item.id, { sizeName: e.target.value })}
                          className={`w-16 bg-slate-950 border rounded-lg px-2 py-1 text-center font-bold font-mono focus:outline-none focus:border-purple-500 ${
                            item.errors.some((e) => e.field === 'sizeName')
                              ? 'border-red-500 text-red-400'
                              : 'border-slate-700 text-white'
                          }`}
                        />
                      </td>

                      {/* Editable Player Name */}
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={item.playerName}
                          onChange={(e) => updateItem(item.id, { playerName: e.target.value })}
                          className={`w-full bg-slate-950 border rounded-lg px-2.5 py-1 uppercase font-bold focus:outline-none focus:border-purple-500 ${
                            item.errors.some((e) => e.field === 'playerName')
                              ? 'border-red-500 text-red-400'
                              : 'border-slate-700 text-white'
                          }`}
                        />
                      </td>

                      {/* Editable Number */}
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={item.playerNumber}
                          onChange={(e) => updateItem(item.id, { playerNumber: e.target.value })}
                          className={`w-16 bg-slate-950 border rounded-lg px-2 py-1 text-center font-black focus:outline-none focus:border-purple-500 ${
                            item.errors.some((e) => e.field === 'playerNumber')
                              ? 'border-red-500 text-red-400'
                              : 'border-slate-700 text-purple-400 font-bold'
                          }`}
                        />
                      </td>

                      {/* Editable Garment Type */}
                      <td className="py-2 px-3">
                        <select
                          value={item.garmentType}
                          onChange={(e) => updateItem(item.id, { garmentType: e.target.value as GarmentType })}
                          className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 focus:outline-none focus:border-purple-500 text-[11px] font-sans"
                        >
                          <option value="COMPLETO">COMPLETO (6 pzs)</option>
                          <option value="CAMISETA">CAMISETA (4 pzs)</option>
                          <option value="SHORT">SHORT (2 pzs)</option>
                        </select>
                      </td>

                      {/* Errors / Warnings Badges */}
                      <td className="py-2 px-3 text-[11px]">
                        {item.errors.length > 0 ? (
                          <div className="flex flex-col gap-0.5 text-red-400 font-sans">
                            {item.errors.map((err, i) => (
                              <span key={i} className="flex items-center gap-1 font-semibold">
                                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                {err.message}
                              </span>
                            ))}
                          </div>
                        ) : item.warnings.length > 0 ? (
                          <div className="flex flex-col gap-0.5 text-amber-400 font-sans">
                            {item.warnings.map((warn, i) => (
                              <span key={i} className="flex items-center gap-1 font-semibold">
                                <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                                {warn.message}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-purple-400 flex items-center gap-1 font-sans font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Correcto 1:1
                          </span>
                        )}
                      </td>

                      {/* Remove Button */}
                      <td className="py-2 px-3 text-center">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Eliminar jugador"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Generation CTA Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1">
              <div className="text-xs text-slate-400">
                {summary.hasErrors ? (
                  <span className="text-red-400 font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    Corrige los {summary.invalidCount} errores en la tabla antes de proceder a la generación.
                  </span>
                ) : (
                  <span className="text-purple-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Todos los {summary.validCount} registros son válidos y listos para producción.
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                <span>
                  Molde:{' '}
                  {currentPatternSet ? (
                    <span className="text-purple-400 font-bold">{currentPatternSet.name}</span>
                  ) : (
                    <span className="text-amber-400 font-semibold inline-flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      Sin Molde (ve a 'Moldes')
                    </span>
                  )}
                </span>
                <span>•</span>
                <span>
                  Diseño:{' '}
                  {currentDesign ? (
                    <span className="text-purple-400 font-bold">{currentDesign.name}</span>
                  ) : (
                    <span className="text-amber-400 font-semibold inline-flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      Sin Diseño (ve a 'Diseños')
                    </span>
                  )}
                </span>
              </div>
            </div>

            <button
              disabled={summary.hasErrors || items.length === 0}
              onClick={() => {
                if (!currentPatternSet) {
                  alert("No hay ningún molde cargado. Ve a la pestaña 'Moldes' y sube tu archivo SVG graduado.");
                  setCurrentView('PATTERNS');
                  return;
                }
                if (!currentDesign) {
                  alert("No hay ningún diseño cargado. Ve a la pestaña 'Diseños' y sube tu archivo SVG de diseño.");
                  setCurrentView('DESIGNS');
                  return;
                }

                if (!activePatternSet && currentPatternSet) {
                  setActivePatternSet(currentPatternSet);
                }
                if (!activeDesign && currentDesign) {
                  setActiveDesign(currentDesign);
                }

                // Generar prendas con el store
                const { generatePieces } = useGeneratorStore.getState();
                const res = generatePieces();
                if (!res) {
                  alert("No se pudieron generar las piezas. Verifica que las tallas del archivo de moldes coincidan con las del Excel.");
                  return;
                }
                setCurrentView('NESTING');
              }}
              className={`px-7 py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2.5 shadow-xl transition-all active:scale-95 ${
                summary.hasErrors || items.length === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-purple-950/70 cursor-pointer ring-1 ring-purple-400/40'
              }`}
            >
              <span>Generar Prendas y Avanzar al Entallado</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
