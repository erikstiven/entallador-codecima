import React, { useRef } from 'react';
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
  RefreshCw
} from 'lucide-react';
import { useOrderStore } from '@/modules/orders/orderStore';
import { useProfileStore } from '@/modules/settings/profileStore';
import { useNavigationStore } from '@/modules/navigation/navigationStore';
import { GarmentType } from '@/modules/orders/types';
import { generateOrderTemplateWorkbook } from '@/modules/orders/excelParser';
import { useGeneratorStore } from '@/modules/generator/generatorStore';

export const NewOrderView: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { activeProfile } = useProfileStore();
  const { setCurrentView } = useNavigationStore();

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
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Top Banner & Profile Overview */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">Paso 1 de 4</span>
          <h2 className="text-xl font-bold text-white mt-1">Cargar Nómina y Pedido de Uniformes</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Sube el archivo Excel (.xlsx o .csv) de tu equipo. El sistema valida nombres, dorsales, tallas existentes y tipos de prenda antes de generar el entallado.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadTemplate}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-950 transition-colors flex items-center gap-1.5"
            title="Descargar archivo Excel con las columnas listas para llenar"
          >
            <Download className="w-3.5 h-3.5" />
            Descargar Plantilla Excel (.xlsx)
          </button>
        </div>
      </div>

      {/* Drag & Drop Zone (if no items loaded) */}
      {items.length === 0 ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-700 hover:border-emerald-500 bg-slate-900/40 hover:bg-slate-900 transition-all rounded-2xl p-16 text-center flex flex-col items-center justify-center cursor-pointer group"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h4 className="text-base font-semibold text-white">Arrastra aquí tu archivo Excel o haz clic para explorar</h4>
          <p className="text-xs text-slate-400 mt-1.5 max-w-md">
            Formatos soportados: <span className="text-slate-200 font-mono font-medium">.xlsx</span> y <span className="text-slate-200 font-mono font-medium">.csv</span>
          </p>
          <button 
            type="button"
            className="mt-6 px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950 transition-colors flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Seleccionar Archivo Excel
          </button>
        </div>
      ) : (
        /* Order Items Table & Real-time Validation */
        <div className="space-y-4">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
              <div className="text-[11px] text-slate-400">Total Jugadores</div>
              <div className="text-xl font-bold font-mono text-white mt-1">{summary.totalItems}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
              <div className="text-[11px] text-slate-400">Total Piezas a Cortar</div>
              <div className="text-xl font-bold font-mono text-sky-400 mt-1">
                {summary.totalPiecesCount} <span className="text-xs font-normal text-slate-400">piezas</span>
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
              <div className="text-[11px] text-slate-400">Estado de Nómina</div>
              {summary.invalidCount > 0 ? (
                <div className="text-xl font-bold font-mono text-red-400 mt-1 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  {summary.invalidCount} con Error
                </div>
              ) : (
                <div className="text-xl font-bold font-mono text-emerald-400 mt-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  100% Válido ({summary.validCount})
                </div>
              )}
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
              <div className="text-[11px] text-slate-400">Archivo Excel Cargado</div>
              <div className="text-xs text-white font-mono truncate" title={fileName || ''}>
                {fileName || 'pedido.xlsx'}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium text-left mt-0.5"
              >
                + Cambiar Archivo
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="p-3.5 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-200">Nómina del Pedido</span>
                <span className="text-[11px] text-slate-400">({items.length} jugadores cargados)</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => addItem({ playerName: 'NUEVO', playerNumber: '00', sizeName: '28', garmentType: 'COMPLETO' })}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agregar Jugador
                </button>
              </div>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 sticky top-0 border-b border-slate-800 z-10 text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center">#</th>
                    <th className="py-2.5 px-3 w-28">Talla</th>
                    <th className="py-2.5 px-3">Nombre Dorsal</th>
                    <th className="py-2.5 px-3 w-24">Número</th>
                    <th className="py-2.5 px-3 w-32">Tipo Prenda</th>
                    <th className="py-2.5 px-3">Validación / Estado</th>
                    <th className="py-2.5 px-3 w-12 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {items.map((item, idx) => (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-slate-800/40 transition-colors ${
                        !item.isValid ? 'bg-red-950/20' : ''
                      }`}
                    >
                      <td className="py-2 px-3 text-center text-slate-500" title={`Fila Excel: ${item.rowNumber}`}>{idx + 1}</td>
                      
                      {/* Editable Size */}
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={item.sizeName}
                          onChange={(e) => updateItem(item.id, { sizeName: e.target.value })}
                          className={`w-16 bg-slate-950 border rounded px-2 py-1 text-center font-bold font-mono focus:outline-none focus:border-emerald-500 ${
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
                          className={`w-full bg-slate-950 border rounded px-2.5 py-1 uppercase focus:outline-none focus:border-emerald-500 ${
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
                          className={`w-16 bg-slate-950 border rounded px-2 py-1 text-center font-bold focus:outline-none focus:border-emerald-500 ${
                            item.errors.some((e) => e.field === 'playerNumber')
                              ? 'border-red-500 text-red-400'
                              : 'border-slate-700 text-emerald-400'
                          }`}
                        />
                      </td>

                      {/* Editable Garment Type */}
                      <td className="py-2 px-3">
                        <select
                          value={item.garmentType}
                          onChange={(e) => updateItem(item.id, { garmentType: e.target.value as GarmentType })}
                          className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-300 focus:outline-none focus:border-emerald-500 text-[11px]"
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
                              <span key={i} className="flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                {err.message}
                              </span>
                            ))}
                          </div>
                        ) : item.warnings.length > 0 ? (
                          <div className="flex flex-col gap-0.5 text-amber-400 font-sans">
                            {item.warnings.map((warn, i) => (
                              <span key={i} className="flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                                {warn.message}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-emerald-400 flex items-center gap-1 font-sans">
                            <CheckCircle2 className="w-3 h-3" />
                            Correcto
                          </span>
                        )}
                      </td>

                      {/* Remove Button */}
                      <td className="py-2 px-3 text-center">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-slate-500 hover:text-red-400 p-1 rounded transition-colors"
                          title="Eliminar fila"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Generation CTA Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              {summary.hasErrors ? (
                <span className="text-red-400 font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  Corrige los {summary.invalidCount} errores en la tabla antes de proceder a la generación.
                </span>
              ) : (
                <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Todos los {summary.validCount} registros son válidos y listos para producción.
                </span>
              )}
            </div>

            <button
              disabled={summary.hasErrors || items.length === 0}
              onClick={() => {
                // Generar prendas con el store
                const { generatePieces } = useGeneratorStore.getState();
                generatePieces();
                setCurrentView('NESTING');
              }}
              className={`px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all ${
                summary.hasErrors || items.length === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950 cursor-pointer'
              }`}
            >
              Generar Prendas y Avanzar al Entallado
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
