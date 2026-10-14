import React, { useRef, useEffect, useState } from 'react';
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
  Scissors,
  Settings2,
  Check,
  Save,
  Loader2
} from 'lucide-react';
import { useOrderStore } from '@/modules/orders/orderStore';
import { useProfileStore } from '@/modules/settings/profileStore';
import { useNavigationStore } from '@/modules/navigation/navigationStore';
import { GarmentType, NecklineType } from '@/modules/orders/types';
import { generateOrderTemplateWorkbook } from '@/modules/orders/excelParser';
import { useGeneratorStore } from '@/modules/generator/generatorStore';
import { usePatternStore } from '@/modules/patterns/patternStore';
import { useDesignStore } from '@/modules/designs/designStore';
import { useNestingStore } from '@/core/nesting/nestingStore';
import { showAlert } from '@/core/ui/alerts';
import { dbService } from '@/core/database/db';

export const NewOrderView: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { activeProfile } = useProfileStore();
  const { setCurrentView } = useNavigationStore();
  const { activePatternSet, patternSets, loadFromDatabase, setActivePatternSet } = usePatternStore();
  const { activeDesign, designs, loadDesignsFromDatabase, setActiveDesign } = useDesignStore();

  const [bulkGarmentType, setBulkGarmentType] = useState<GarmentType>('COMPLETO');
  const [bulkNecklineType, setBulkNecklineType] = useState<NecklineType>('REDONDO');
  const [bulkSizeName, setBulkSizeName] = useState<string>('');
  const [bulkQuantity, setBulkQuantity] = useState<number>(1);
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState<string | null>(null);
  const [isGeneratingAction, setIsGeneratingAction] = useState<boolean>(false);
  const [isSavingRoster, setIsSavingRoster] = useState<boolean>(false);
  const [isRosterSaved, setIsRosterSaved] = useState<boolean>(false);

  useEffect(() => {
    if (patternSets.length === 0) loadFromDatabase();
    if (designs.length === 0) loadDesignsFromDatabase();
  }, []);

  const currentPatternSet = activePatternSet || patternSets[0] || null;
  const currentDesign = activeDesign || designs[0] || null;

  const handleClearOrder = async () => {
    const confirmed = await showAlert.confirm(
      '¿Limpiar la nómina actual?',
      'Se limpiará la nómina, las prendas generadas y el acomodo del rollo. Esta acción no elimina diseños ni moldes.'
    );
    if (!confirmed) return;
    clearOrder();
    useGeneratorStore.getState().clearGenerated();
    useNestingStore.getState().clearNesting();
    if (fileInputRef.current) fileInputRef.current.value = '';
    showAlert.toast('info', 'Pedido limpiado');
  };

  const {
    items,
    summary,
    fileName,
    clientName,
    teamName,
    sport,
    availableSizes,
    setAvailableSizes,
    setClientName,
    setTeamName,
    setSport,
    loadFromBuffer,
    updateItem,
    removeItem,
    addItem,
    clearOrder,
    setAllGarmentTypes,
    setAllNecklineTypes,
    applyMassEdit,
  } = useOrderStore();

  useEffect(() => {
    if (currentPatternSet && currentPatternSet.sizes.length > 0) {
      const patternSizes = currentPatternSet.sizes.map((s) => s.sizeName);
      setAvailableSizes(patternSizes);
    }
  }, [currentPatternSet]);

  const handleSaveRoster = async () => {
    if (items.length === 0 || isSavingRoster) return;
    setIsSavingRoster(true);
    setIsRosterSaved(false);
    try {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(
            'cimatex_saved_order_roster_v1',
            JSON.stringify({
              items,
              fileName,
              clientName,
              teamName,
              sport,
              savedAt: new Date().toISOString(),
            })
          );
        }
      } catch (_) {}
      await dbService.persistBrowserDb();
      setIsSavingRoster(false);
      setIsRosterSaved(true);
      showAlert.toast(
        'success',
        `¡Nómina guardada correctamente (${items.length} jugador${items.length === 1 ? '' : 'es'})!`
      );
      setTimeout(() => setIsRosterSaved(false), 2500);
    } catch (err) {
      console.error('Error guardando nómina:', err);
      setIsSavingRoster(false);
      showAlert.error('Error al Guardar', 'No se pudo guardar la nómina actual.');
    }
  };

  const handleExecuteMassEdit = async () => {
    if (items.length === 0) return;

    let willOverwriteDifferent = false;
    if (items.some((i) => i.garmentType !== bulkGarmentType)) willOverwriteDifferent = true;
    if (bulkGarmentType !== 'SHORT' && items.some((i) => i.garmentType !== 'SHORT' && (i.necklineType || 'REDONDO') !== bulkNecklineType)) willOverwriteDifferent = true;
    if (bulkSizeName.trim() && items.some((i) => i.sizeName !== bulkSizeName.trim().toUpperCase())) willOverwriteDifferent = true;
    if (bulkQuantity > 0 && items.some((i) => (i.quantity || 1) !== bulkQuantity)) willOverwriteDifferent = true;

    if (willOverwriteDifferent) {
      const confirmed = await showAlert.confirm(
        '¿Aplicar a TODOS los registros?',
        'Se sobreescribirán las tallas, prendas o cuellos existentes en la nómina.'
      );
      if (!confirmed) return;
    }

    applyMassEdit({
      garmentType: bulkGarmentType,
      necklineType: bulkGarmentType === 'SHORT' ? undefined : bulkNecklineType,
      sizeName: bulkSizeName.trim() ? bulkSizeName.trim().toUpperCase() : undefined,
      quantity: bulkQuantity > 0 ? bulkQuantity : undefined,
    });

    showAlert.toast('success', '¡Edición masiva aplicada a todo el pedido!');
  };

  const missingProductionSetup = [
    !currentPatternSet ? 'molde' : null,
    !currentDesign ? 'diseño' : null,
  ].filter((value): value is string => Boolean(value));
  const canProceedToNesting = items.length > 0 && !summary.hasErrors && summary.validCount > 0;
  const isProductionReady = canProceedToNesting && missingProductionSetup.length === 0;
  const disabledReasonMessage =
    items.length === 0 || summary.validCount === 0
      ? 'Agrega al menos 1 jugador válido para continuar'
      : summary.hasErrors
        ? 'Corrige las filas marcadas en rojo antes de continuar'
        : null;

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

  const handleDownloadTemplate = async () => {
    try {
      const uint8 = await generateOrderTemplateWorkbook(availableSizes);
      const blob = new Blob([uint8.buffer as ArrayBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'plantilla_pedido_uniformes.xlsx';
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generando plantilla:', err);
      showAlert.error('Error', 'No se pudo generar la plantilla Excel.');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 text-slate-800">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Import Card (Single unified zone when no items loaded) */}
      {items.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Cargar Nómina del Pedido
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Sube la planilla con nombres, números y tallas o crea la nómina manualmente
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() =>
                  addItem({
                    playerName: 'JUGADOR 1',
                    playerNumber: '1',
                    sizeName: availableSizes[0] || 'S',
                    garmentType: 'COMPLETO',
                    necklineType: 'REDONDO',
                    quantity: 1,
                  })
                }
                className="px-3.5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
                title="Agregar jugadores directamente a la lista sin archivo Excel"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Crear Nómina Manualmente</span>
              </button>

              <button
                onClick={handleDownloadTemplate}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-lg text-xs font-semibold border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0 shadow-xs"
                title="Descargar archivo Excel con menús desplegables (select) y tallas sincronizadas"
              >
                <Download className="w-3.5 h-3.5 text-violet-600" />
                <span>Descargar Plantilla (.xlsx)</span>
              </button>
            </div>
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-violet-400 bg-slate-50/50 hover:bg-violet-50/20 transition-all duration-200 rounded-xl p-12 text-center flex flex-col items-center justify-center cursor-pointer group shadow-2xs"
          >
            <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 text-slate-500 group-hover:text-violet-600 group-hover:border-violet-300 flex items-center justify-center mb-3 group-hover:scale-105 transition-all shadow-xs">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-800 group-hover:text-violet-700 transition-colors">
              Arrastra tu archivo Excel aquí o haz clic para seleccionarlo
            </h4>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              Formatos compatibles: .xlsx, .xls, .csv • Con selectores desplegables
            </p>
          </div>
        </div>
      ) : (
        /* Order Items Table & Real-time Validation */
        <div className="space-y-4">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Jugadores</div>
              <div className="text-2xl font-black font-mono text-slate-900 mt-1">{summary.totalItems}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">En la nómina activa</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Piezas a Producir</div>
              <div className="text-2xl font-black font-mono text-sky-600 mt-1">
                {summary.totalPiecesCount} <span className="text-xs font-semibold text-slate-500">piezas</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Frente, espalda, mangas y shorts</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Validación de Nómina</div>
              {summary.invalidCount > 0 ? (
                <div className="text-2xl font-black font-mono text-red-600 mt-1 flex items-center gap-1.5">
                  <AlertCircle className="w-5 h-5" />
                  {summary.invalidCount} Error(es)
                </div>
              ) : (
                <div className="text-2xl font-black font-mono text-emerald-600 mt-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-5 h-5" />
                  100% Correcto
                </div>
              )}
              <div className="text-[10px] text-slate-400 mt-0.5">{summary.validCount} de {summary.totalItems} listos</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Archivo Excel</div>
                <div className="text-xs text-slate-800 font-mono font-bold truncate mt-1" title={fileName || ''}>
                  {fileName || 'pedido.xlsx'}
                </div>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-[11px] text-violet-600 hover:text-violet-800 font-bold text-left mt-2 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Reemplazar Excel
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs space-y-0">
            {/* Sección Visible "Aplicar a Todos" */}
            <div className="p-4 bg-slate-50/80 border-b border-slate-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-violet-600" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-900">Edición Masiva — Aplicar a Todos</span>
                  {bulkSuccessMsg && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 rounded-lg flex items-center gap-1 animate-pulse">
                      <Check className="w-3.5 h-3.5" />
                      {bulkSuccessMsg}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleSaveRoster}
                    disabled={items.length === 0 || isSavingRoster}
                    className={`px-3 py-1 rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                      isRosterSaved
                        ? 'bg-emerald-600 text-white border border-emerald-500 shadow-emerald-500/20'
                        : 'bg-sky-600 hover:bg-sky-500 text-white border border-sky-500/40'
                    }`}
                    title="Guardar manualmente los cambios de la nómina actual"
                  >
                    {isSavingRoster ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Guardando nómina...
                      </>
                    ) : isRosterSaved ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        ¡Nómina Guardada!
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        Guardar Nómina
                      </>
                    )}
                  </button>
                  {items.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearOrder}
                      className="px-3 py-1 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-lg text-xs font-semibold border border-slate-200 hover:border-red-300 transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Limpiar únicamente el pedido actual"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Limpiar pedido
                    </button>
                  )}
                  <button
                    onClick={() => addItem({ playerName: 'NUEVO', playerNumber: '00', sizeName: availableSizes[0] || 'S', garmentType: 'CAMISETA', necklineType: 'REDONDO', quantity: 1 })}
                    className="px-3 py-1 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Agregar Jugador
                  </button>
                </div>
              </div>

              {/* Mass Edit Controls Toolbar */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 bg-white p-3 rounded-xl border border-slate-200">
                {/* Prenda */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-slate-500 font-bold">Tipo Prenda:</label>
                  <select
                    value={bulkGarmentType}
                    onChange={(e) => setBulkGarmentType(e.target.value as GarmentType)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-violet-500 font-medium cursor-pointer"
                  >
                    <option value="COMPLETO">COMPLETO (6 pzs)</option>
                    <option value="CAMISETA">CAMISETA (4 pzs)</option>
                    <option value="SHORT">SHORT (2 pzs)</option>
                  </select>
                </div>

                {/* Cuello (Deshabilitado para shorts) */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-slate-500 font-bold">
                    Cuello {bulkGarmentType === 'SHORT' ? '(N/A)' : ''}:
                  </label>
                  <select
                    value={bulkNecklineType}
                    disabled={bulkGarmentType === 'SHORT'}
                    onChange={(e) => setBulkNecklineType(e.target.value as NecklineType)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-violet-500 font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <option value="REDONDO">REDONDO</option>
                    <option value="V">CUELLO V</option>
                  </select>
                </div>

                {/* Talla */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-slate-500 font-bold">Talla (Opcional):</label>
                  <input
                    type="text"
                    placeholder="Mantener individual"
                    value={bulkSizeName}
                    onChange={(e) => setBulkSizeName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800 uppercase placeholder:text-slate-400 focus:outline-none focus:border-violet-500 font-mono"
                  />
                </div>

                {/* Cantidad */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-slate-500 font-bold">Cantidad:</label>
                  <input
                    type="number"
                    min="1"
                    value={bulkQuantity}
                    onChange={(e) => setBulkQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800 text-center focus:outline-none focus:border-violet-500 font-mono"
                  />
                </div>

                {/* Modelo Asignado */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-slate-500 font-bold">Modelo Asignado:</label>
                  <select
                    value={activeDesign?.id || ''}
                    onChange={(e) => {
                      const selected = designs.find((d) => d.id === e.target.value);
                      if (selected) setActiveDesign(selected);
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs text-violet-700 font-semibold focus:outline-none focus:border-violet-500 truncate cursor-pointer"
                  >
                    {designs.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Botón Aplicar */}
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleExecuteMassEdit}
                    className="w-full py-1.5 px-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-lg text-xs font-black shadow-sm transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Aplicar a Todos
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 text-slate-500 sticky top-0 border-b border-slate-200 z-10 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3 w-12 text-center">#</th>
                    <th className="py-3 px-3 w-32">Talla</th>
                    <th className="py-3 px-3 w-20 text-center">Cant.</th>
                    <th className="py-3 px-3">Nombre Dorsal</th>
                    <th className="py-3 px-3 w-24">Número</th>
                    <th className="py-3 px-3 w-36">Tipo Prenda</th>
                    <th className="py-3 px-3 w-28">Cuello</th>
                    <th className="py-3 px-3">Validación / Estado</th>
                    <th className="py-3 px-3 w-12 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {items.map((item, idx) => (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-slate-50/80 transition-colors ${
                        !item.isValid ? 'bg-red-50/50' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center text-slate-400 font-bold" title={`Fila Excel: ${item.rowNumber}`}>{idx + 1}</td>
                      
                      {/* Editable Size */}
                      <td className="py-2 px-3">
                        <select
                          value={item.sizeName}
                          onChange={(e) => updateItem(item.id, { sizeName: e.target.value })}
                          className={`w-full bg-white border rounded-lg px-2 py-1 font-bold font-mono text-xs focus:outline-none focus:border-violet-500 cursor-pointer ${
                            item.errors.some((e) => e.field === 'sizeName')
                              ? 'border-red-500 text-red-600 bg-red-50'
                              : 'border-slate-300 text-slate-900'
                          }`}
                        >
                          {(!item.sizeName || !availableSizes.some((s) => s.toUpperCase() === item.sizeName.toUpperCase())) && (
                            <option value={item.sizeName || ''}>
                              {item.sizeName ? `${item.sizeName} (No registrada)` : '-- Seleccionar --'}
                            </option>
                          )}
                          {availableSizes.map((sz) => (
                            <option key={sz} value={sz}>
                              {sz}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Editable Quantity */}
                      <td className="py-2 px-3 text-center">
                        <input
                          type="number"
                          min="1"
                          max="999"
                          value={item.quantity || 1}
                          onChange={(e) => updateItem(item.id, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                          className="w-16 px-2 py-1 text-center border border-slate-200 rounded-md text-sm"
                        />
                      </td>

                      {/* Editable Player Name */}
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={item.playerName}
                          onChange={(e) => updateItem(item.id, { playerName: e.target.value })}
                          className={`w-full bg-white border rounded-lg px-2.5 py-1 uppercase font-bold focus:outline-none focus:border-violet-500 ${
                            item.errors.some((e) => e.field === 'playerName')
                              ? 'border-red-500 text-red-600 bg-red-50'
                              : 'border-slate-300 text-slate-900'
                          }`}
                        />
                      </td>

                      {/* Editable Number */}
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={item.playerNumber}
                          onChange={(e) => updateItem(item.id, { playerNumber: e.target.value })}
                          className={`w-16 bg-white border rounded-lg px-2 py-1 text-center font-black focus:outline-none focus:border-violet-500 ${
                            item.errors.some((e) => e.field === 'playerNumber')
                              ? 'border-red-500 text-red-600 bg-red-50'
                              : 'border-slate-300 text-violet-700 font-bold'
                          }`}
                        />
                      </td>

                      {/* Editable Garment Type */}
                      <td className="py-2 px-3">
                        <select
                          value={item.garmentType}
                          onChange={(e) => updateItem(item.id, { garmentType: e.target.value as GarmentType })}
                          className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-800 focus:outline-none focus:border-violet-500 text-[11px] font-sans cursor-pointer"
                        >
                          <option value="COMPLETO">COMPLETO (6 pzs)</option>
                          <option value="CAMISETA">CAMISETA (4 pzs)</option>
                          <option value="SHORT">SHORT (2 pzs)</option>
                        </select>
                      </td>

                      {/* Tipo de cuello explícito para seleccionar el molde correcto */}
                      <td className="py-2 px-3">
                        <select
                          value={item.necklineType || 'REDONDO'}
                          disabled={item.garmentType === 'SHORT'}
                          onChange={(e) => updateItem(item.id, { necklineType: e.target.value as NecklineType })}
                          className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-800 focus:outline-none focus:border-violet-500 text-[11px] font-sans disabled:opacity-40 cursor-pointer"
                        >
                          <option value="REDONDO">REDONDO</option>
                          <option value="V">CUELLO V</option>
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

        </div>
      )}

      {/* Bottom Generation CTA Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="text-xs text-slate-600">
            {items.length === 0 ? (
              <span className="text-slate-600 font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Carga un archivo Excel o agrega jugadores para habilitar la generación de prendas.
              </span>
            ) : summary.hasErrors ? (
              <span className="text-red-600 font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                Corrige los {summary.invalidCount} errores en la tabla antes de proceder a la generación.
              </span>
            ) : missingProductionSetup.length > 0 ? (
              <span className="text-amber-600 font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                La nómina es válida, pero falta {missingProductionSetup.join(' y ')} para poder generar las prendas.
              </span>
            ) : (
              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Todos los {summary.validCount} registros son válidos y listos para producción.
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
            <span>
              Molde:{' '}
              {currentPatternSet ? (
                <span className="text-violet-700 font-bold">{currentPatternSet.name}</span>
              ) : (
                <span className="text-amber-600 font-semibold inline-flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                  Sin Molde (ve a 'Moldes')
                </span>
              )}
            </span>
            <span>•</span>
            <span>
              Diseño:{' '}
              {currentDesign ? (
                <span className="text-violet-700 font-bold">{currentDesign.name}</span>
              ) : (
                <span className="text-amber-600 font-semibold inline-flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                  Sin Diseño (ve a 'Diseños')
                </span>
              )}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-stretch md:items-end gap-2">
          <button
            disabled={!canProceedToNesting || isGeneratingAction}
            onClick={async () => {
              if (!canProceedToNesting || isGeneratingAction) return;

              if (missingProductionSetup.length > 0) {
                const missingLabel = missingProductionSetup.join(' y ');
                showAlert.warning(
                  'Configuración Incompleta',
                  `No se puede generar el pedido: falta ${missingLabel}. Completa la configuración requerida antes de avanzar al entallado.`
                );
                setCurrentView(!currentPatternSet ? 'PATTERNS' : 'DESIGNS');
                return;
              }

              setIsGeneratingAction(true);
              try {
                await new Promise((resolve) => setTimeout(resolve, 80));

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
                  setIsGeneratingAction(false);
                  showAlert.error(
                    'Error de Generación',
                    'No se pudieron generar las piezas. Verifica que las tallas del archivo de moldes coincidan con las del Excel.'
                  );
                  return;
                }
                useNestingStore.getState().clearNesting();
                const generatedPieces = useGeneratorStore.getState().generatedPieces;
                showAlert.toast('success', `¡${generatedPieces.length} piezas vectoriales generadas! Revisa los dorsales y ajustes en la pestaña de inspección.`);
                setCurrentView('NESTING');
              } finally {
                setIsGeneratingAction(false);
              }
            }}
            title={
              !canProceedToNesting
                ? (disabledReasonMessage || 'Completa la nómina para generar prendas')
                : 'Genera las piezas vectoriales 1:1 y conduce a la Inspección y Calibración de Prendas antes de acomodar en el rollo'
            }
            className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              !canProceedToNesting || isGeneratingAction
                ? 'bg-slate-100 text-slate-400 border border-slate-200'
                : 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-200'
            }`}
          >
            {isGeneratingAction ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Generando uniformes 1:1...</span>
              </>
            ) : (
              <>
                <span>Generar Prendas y Avanzar al Entallado</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {!canProceedToNesting && disabledReasonMessage && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>{disabledReasonMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
