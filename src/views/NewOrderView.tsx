import React, { useRef, useEffect, useState, useMemo } from 'react';
import { 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Trash2, 
  Plus, 
  Download, 
  ArrowRight,
  Sliders,
  ChevronDown,
  Check,
  Save,
  Loader2,
  Layers,
  Palette,
  ExternalLink,
  Users
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
import { Select, Button } from '@/components/ui';

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
  const [isMassEditOpen, setIsMassEditOpen] = useState<boolean>(false);
  const [isGeneratingAction, setIsGeneratingAction] = useState<boolean>(false);
  const [isSavingRoster, setIsSavingRoster] = useState<boolean>(false);
  const [isRosterSaved, setIsRosterSaved] = useState<boolean>(false);
  const [fileTimestamp, setFileTimestamp] = useState<string | null>(null);

  useEffect(() => {
    if (patternSets.length === 0) loadFromDatabase();
    if (designs.length === 0) loadDesignsFromDatabase();
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
    availableSizes,
    setAvailableSizes,
    setValidationContext,
    loadFromBuffer,
    updateItem,
    removeItem,
    addItem,
    clearOrder,
    applyMassEdit,
  } = useOrderStore();

  // Sincronizar contexto de validación en tiempo real cuando cambia el molde o diseño activo
  useEffect(() => {
    setValidationContext({
      activePatternSet: currentPatternSet,
      activeDesign: currentDesign,
      allPatternSets: patternSets,
    });
  }, [currentPatternSet, currentDesign, patternSets]);

  // Cobertura del Molde Maestro
  const hasCamisetaPattern = useMemo(() => {
    if (!currentPatternSet || !currentPatternSet.sizes || currentPatternSet.sizes.length === 0) return false;
    return currentPatternSet.sizes.some((sz) =>
      sz.pieces &&
      sz.pieces.some((p) => p.pieceType && p.pieceType.startsWith('DELANTERO')) &&
      sz.pieces.some((p) => p.pieceType === 'ESPALDA')
    );
  }, [currentPatternSet]);

  const hasShortPattern = useMemo(() => {
    if (!currentPatternSet || !currentPatternSet.sizes || currentPatternSet.sizes.length === 0) return false;
    return currentPatternSet.sizes.some((sz) =>
      sz.pieces &&
      sz.pieces.some((p) => p.pieceType && (p.pieceType.startsWith('PANTALONETA') || p.pieceType.startsWith('SHORT')))
    );
  }, [currentPatternSet]);

  // Cobertura del Diseño Gráfico
  const hasCamisetaDesign = useMemo(() => {
    if (!currentDesign) return false;
    const arts = currentDesign.pieceArtworks || {};
    const hasFront = Boolean(arts['DELANTERO'] || arts['DELANTERO_REDONDO'] || arts['DELANTERO_V']);
    const hasBack = Boolean(arts['ESPALDA']);
    const hasSleeves = Boolean(arts['MANGA_IZQ'] || arts['MANGA_DER'] || (arts as any)['MANGA']);
    return hasFront && hasBack && hasSleeves;
  }, [currentDesign]);

  const hasShortDesign = useMemo(() => {
    if (!currentDesign) return false;
    const arts = currentDesign.pieceArtworks || {};
    return Boolean(
      arts['SHORT_FRENTE'] ||
      arts['SHORT_ESPALDA'] ||
      arts['PANTALONETA_IZQ'] ||
      arts['PANTALONETA_DER'] ||
      (arts as any)['SHORT']
    );
  }, [currentDesign]);

  // Detección de incompatibilidades globales con la nómina activa
  const incompatibilityBanner = useMemo(() => {
    if (items.length === 0) return null;
    const shortItems = items.filter((it) => it.garmentType === 'SHORT' || it.garmentType === 'COMPLETO');
    const camisetaItems = items.filter((it) => it.garmentType === 'CAMISETA' || it.garmentType === 'COMPLETO');

    if (currentDesign && shortItems.length > 0 && !hasShortDesign) {
      return {
        type: 'danger' as const,
        title: 'Diseño Incompatible con Short / Pantaloneta',
        message: `El pedido contiene ${shortItems.length} registro(s) con Short, pero el diseño activo ("${currentDesign.name}") solo contiene artes de Camiseta. Se han marcado en rojo las filas afectadas. Puedes cambiar el tipo de prenda a CAMISETA en Edición Masiva o seleccionar un diseño que contenga piezas de short.`,
      };
    }

    if (currentDesign && camisetaItems.length > 0 && !hasCamisetaDesign) {
      return {
        type: 'danger' as const,
        title: 'Diseño Incompleto para Camiseta',
        message: `El diseño "${currentDesign.name}" no contiene todas las piezas requeridas para camiseta (delantero, espalda y mangas).`,
      };
    }

    if (currentPatternSet && shortItems.length > 0 && !hasShortPattern) {
      const hasAlternativeShortSet = patternSets.some(
        (ps) =>
          ps.id !== currentPatternSet.id &&
          ps.sizes.some((sz) =>
            sz.pieces.some((p) => p.pieceType.startsWith('PANTALONETA') || p.pieceType.startsWith('SHORT'))
          )
      );
      if (hasAlternativeShortSet) {
        return {
          type: 'info' as const,
          title: 'Moldería de Short Vinculada Automáticamente',
          message: `El molde activo ("${currentPatternSet.name}") contiene piezas de camiseta. CimaTex vinculará automáticamente las pantalonetas desde tu biblioteca de moldes para completar el uniforme de 6 piezas.`,
        };
      }
      return {
        type: 'warning' as const,
        title: 'Molde sin Moldería de Short',
        message: `El molde activo ("${currentPatternSet.name}") no incluye piezas de Short / Pantaloneta en sus tallas. Anexa el archivo SVG de pantaloneta en Molderías para producir el uniforme completo.`,
      };
    }

    return null;
  }, [items, currentDesign, currentPatternSet, patternSets, hasShortDesign, hasCamisetaDesign, hasShortPattern]);

  const handleClearOrder = async () => {
    if (items.length === 0) return;
    const confirmed = await showAlert.confirm(
      '¿Limpiar la nómina actual?',
      'Se limpiará la nómina, las prendas generadas y el acomodo del rollo. Esta acción no elimina diseños ni moldes.'
    );
    if (!confirmed) return;
    clearOrder();
    useGeneratorStore.getState().clearGenerated();
    useNestingStore.getState().clearNesting();
    if (fileInputRef.current) fileInputRef.current.value = '';
    setFileTimestamp(null);
    showAlert.toast('info', 'Pedido limpiado');
  };

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
    if (bulkSizeName && items.some((i) => i.sizeName !== bulkSizeName)) willOverwriteDifferent = true;
    if (bulkQuantity > 0 && items.some((i) => (i.quantity || 1) !== bulkQuantity)) willOverwriteDifferent = true;

    if (willOverwriteDifferent) {
      const confirmed = await showAlert.confirm(
        '¿Aplicar a TODOS los registros?',
        'Se sobreescribirán las prendas, cuellos, tallas o cantidades en la nómina activa.'
      );
      if (!confirmed) return;
    }

    applyMassEdit({
      garmentType: bulkGarmentType,
      necklineType: bulkGarmentType === 'SHORT' ? undefined : bulkNecklineType,
      sizeName: bulkSizeName ? bulkSizeName : undefined,
      quantity: bulkQuantity > 0 ? bulkQuantity : undefined,
    });

    showAlert.toast('success', '¡Edición masiva aplicada a todo el pedido!');
  };

  const handleAddPlayer = () => {
    addItem({
      playerName: `JUGADOR ${items.length + 1}`,
      playerNumber: '',
      sizeName: availableSizes[0] || 'S',
      garmentType: 'COMPLETO',
      necklineType: 'REDONDO',
      quantity: 1,
    });
  };

  const missingProductionSetup = [
    !currentPatternSet ? 'molde' : null,
    !currentDesign ? 'diseño' : null,
  ].filter((value): value is string => Boolean(value));
  const canProceedToNesting = items.length > 0 && !summary.hasErrors && summary.validCount > 0;
  const disabledReasonMessage =
    items.length === 0 || summary.validCount === 0
      ? 'Agrega al menos 1 jugador válido para continuar'
      : summary.hasErrors
        ? `Corrige los ${summary.invalidCount} errores en la nómina (incompatibilidad de molde o diseño) antes de continuar`
        : !currentPatternSet
          ? 'Selecciona un molde maestro activo para continuar'
          : !currentDesign
            ? 'Selecciona un diseño gráfico activo para continuar'
            : null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      if (buffer) {
        loadFromBuffer(buffer, file.name);
        setFileTimestamp(
          new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) +
            ', ' +
            new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
        );
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
        setFileTimestamp(
          new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) +
            ', ' +
            new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
        );
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
    <div className="p-6 w-full space-y-5 text-slate-800 animate-in fade-in duration-200">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* 1. ENCABEZADO SUPERIOR (Estandarizado y alineado con Nesting) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl px-5 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Gestión de Pedidos</span>
            <span className="w-1.5 h-1.5 rounded-full bg-violet-600 shrink-0" />
          </h2>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            Nómina de jugadores, números, prendas y tallas
          </p>
        </div>

        {/* Grupo de botones a la derecha alineados */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Cargar Excel (Secundario blanco) */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            title="Cargar archivo Excel (.xlsx, .xls o .csv)"
          >
            <UploadCloud className="w-3.5 h-3.5 text-violet-600" />
            <span>Cargar Excel</span>
          </Button>

          {/* Descargar Plantilla (SIEMPRE visible) */}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownloadTemplate}
            title="Descargar plantilla Excel oficial con listas desplegables"
          >
            <Download className="w-3.5 h-3.5 text-violet-600" />
            <span className="hidden sm:inline">Descargar Plantilla</span>
          </Button>

          {/* Guardar Nómina */}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSaveRoster}
            disabled={items.length === 0 || isSavingRoster}
            className={isRosterSaved ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : ''}
            title="Guardar nómina activa"
          >
            {isSavingRoster ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
                <span>Guardando...</span>
              </>
            ) : isRosterSaved ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>¡Guardado!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 text-slate-500" />
                <span>Guardar Nómina</span>
              </>
            )}
          </Button>

          {/* Limpiar Pedido */}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleClearOrder}
            disabled={items.length === 0}
            className="text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200"
            title="Limpiar la nómina actual"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Limpiar pedido</span>
          </Button>
        </div>
      </div>

      {/* 2. VINCULACIÓN INTELIGENTE DE PRODUCCIÓN: MOLDE Y DISEÑO */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-600 animate-pulse" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 font-mono">
              Vinculación de Producción — Molde y Diseño Activos
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            La nómina se valida en tiempo real contra las piezas y tallas del molde y los artes vectoriales del diseño.
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Selector de Molde Maestro */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-700 uppercase font-mono flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-violet-600" />
                <span>Molde Maestro Activo:</span>
                {currentPatternSet && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 font-semibold font-sans">
                    {currentPatternSet.sizes.length} tallas
                  </span>
                )}
              </label>
              <button
                type="button"
                onClick={() => setCurrentView('PATTERNS')}
                className="text-[11px] text-violet-600 hover:text-violet-700 font-bold hover:underline cursor-pointer flex items-center gap-1"
                title="Ir a Molderías para cargar o editar patrones"
              >
                <span>Molderías</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <Select
              sizeVariant="sm"
              value={currentPatternSet?.id || ''}
              onChange={(e) => {
                const selected = patternSets.find((p) => p.id === e.target.value);
                if (selected) {
                  setActivePatternSet(selected);
                }
              }}
            >
              {patternSets.length === 0 ? (
                <option value="">No hay moldes guardados</option>
              ) : (
                patternSets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sizes.length} tallas: {p.sizes.map((s) => s.sizeName).slice(0, 6).join(', ')}{p.sizes.length > 6 ? '...' : ''})
                  </option>
                ))
              )}
            </Select>
          </div>

          {/* Selector de Diseño Gráfico */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-700 uppercase font-mono flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-violet-600" />
                <span>Diseño Gráfico (Artes SVG):</span>
                {currentDesign && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 font-semibold font-sans">
                    {currentDesign.sport || 'FUTBOL'}
                  </span>
                )}
              </label>
              <button
                type="button"
                onClick={() => setCurrentView('DESIGNS')}
                className="text-[11px] text-violet-600 hover:text-violet-700 font-bold hover:underline cursor-pointer flex items-center gap-1"
                title="Ir a Diseños para cargar o editar artes SVG"
              >
                <span>Diseños</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <Select
              sizeVariant="sm"
              value={currentDesign?.id || ''}
              onChange={(e) => {
                const selected = designs.find((d) => d.id === e.target.value);
                if (selected) {
                  setActiveDesign(selected);
                }
              }}
            >
              {designs.length === 0 ? (
                <option value="">No hay diseños guardados</option>
              ) : (
                designs.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.sport || 'FUTBOL'})
                  </option>
                ))
              )}
            </Select>
          </div>
        </div>
      </div>

      {/* Banner de compatibilidad inteligente de producción */}
      {incompatibilityBanner && (
        <div
          className={`rounded-2xl p-4 border flex items-start gap-3 shadow-2xs ${
            incompatibilityBanner.type === 'danger'
              ? 'bg-rose-50/80 border-rose-200 text-rose-900'
              : incompatibilityBanner.type === 'info'
              ? 'bg-sky-50/80 border-sky-200 text-sky-900'
              : 'bg-amber-50/80 border-amber-200 text-amber-900'
          }`}
        >
          {incompatibilityBanner.type === 'danger' ? (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          ) : incompatibilityBanner.type === 'info' ? (
            <CheckCircle2 className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1 text-xs">
            <h4 className="font-bold">{incompatibilityBanner.title}</h4>
            <p className="opacity-90 leading-relaxed">{incompatibilityBanner.message}</p>
          </div>
        </div>
      )}

      {/* 3. TARJETAS KPI (4 tarjetas compactas, limpias y conectadas) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* KPI 1: Total Jugadores */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
            Total Jugadores
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 mt-1">
            {summary.totalItems}
          </div>
          <div className="text-[11px] text-slate-400 font-medium mt-0.5">
            {summary.totalItems === 1 ? '1 jugador en nómina' : `${summary.totalItems} jugadores en nómina`}
          </div>
        </div>

        {/* KPI 2: Piezas a Producir */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
            Piezas a Producir
          </div>
          <div className="text-2xl font-black font-mono text-sky-600 mt-1">
            {summary.totalPiecesCount} <span className="text-xs font-semibold text-slate-500">piezas</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
            {(summary.byGarmentType?.COMPLETO || 0) + (summary.byGarmentType?.CAMISETA || 0)} camisetas • {(summary.byGarmentType?.COMPLETO || 0) + (summary.byGarmentType?.SHORT || 0)} shorts
          </div>
        </div>

        {/* KPI 3: Validación de Nómina */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
            Validación de Nómina
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            {items.length === 0 ? (
              <span className="text-sm font-bold text-slate-400 font-mono">
                Sin datos
              </span>
            ) : summary.invalidCount > 0 ? (
              <div className="text-xl font-black font-mono text-red-600 flex items-center gap-1.5">
                <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
                <span>{summary.invalidCount} Error{summary.invalidCount > 1 ? 'es' : ''}</span>
              </div>
            ) : (summary.warningCount || 0) > 0 ? (
              <div className="text-xl font-black font-mono text-amber-600 flex items-center gap-1.5">
                <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500" />
                <span>{summary.validCount} Válidos</span>
              </div>
            ) : (
              <div className="text-xl font-black font-mono text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
                <span>100% Válida</span>
              </div>
            )}
          </div>
          <div className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">
            {items.length === 0
              ? 'Nómina vacía'
              : summary.invalidCount > 0
                ? `${summary.invalidCount} fila(s) con errores a corregir`
                : (summary.warningCount || 0) > 0
                  ? `${summary.warningCount} registro(s) con ajuste horizontal`
                  : `${summary.validCount} listos para producción`}
          </div>
        </div>

        {/* KPI 4: Archivo Excel */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
            Archivo Excel
          </div>
          <div className="text-xs font-bold font-mono text-slate-800 truncate mt-1.5" title={fileName || 'Sin archivo'}>
            {fileName || 'Carga manual / Sin archivo'}
          </div>
          <div className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
            {fileTimestamp || (fileName ? 'Reciente' : 'Listo para importar')}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* 3. BARRA DE EDICIÓN MASIVA COMPACTA Y PLEGABLE (Visible cuando hay jugadores en nómina) */}
        {items.length > 0 && (
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
            <div
              onClick={() => setIsMassEditOpen((prev) => !prev)}
              className="px-4 py-2.5 bg-slate-50/70 hover:bg-slate-50 flex items-center justify-between cursor-pointer select-none transition-colors border-b border-slate-200/70"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-violet-600" />
                <span className="text-xs font-bold text-slate-800">
                  Edición Masiva — Aplicar a Todos
                </span>
                <span className="hidden sm:inline text-[11px] text-slate-400 font-medium">
                  (Prendas, cuellos, tallas y cantidades)
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <span>{isMassEditOpen ? 'Ocultar' : 'Configurar'}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isMassEditOpen ? 'rotate-180 text-violet-600' : 'text-slate-400'
                  }`}
                />
              </div>
            </div>

            {isMassEditOpen && (
              <div className="p-3.5 bg-white border-t border-slate-100 max-h-[85vh] overflow-y-auto">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 items-end">
                  {/* Tipo Prenda */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono text-slate-500 font-bold block">
                      Tipo Prenda:
                    </label>
                    <Select
                      sizeVariant="sm"
                      value={bulkGarmentType}
                      onChange={(e) => setBulkGarmentType(e.target.value as GarmentType)}
                    >
                      <option value="COMPLETO">COMPLETO (6 pzs)</option>
                      <option value="CAMISETA">CAMISETA (4 pzs)</option>
                      <option value="SHORT">SHORT (2 pzs)</option>
                    </Select>
                  </div>

                  {/* Cuello */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono text-slate-500 font-bold block">
                      Cuello {bulkGarmentType === 'SHORT' ? '(N/A)' : ''}:
                    </label>
                    <Select
                      sizeVariant="sm"
                      value={bulkNecklineType}
                      disabled={bulkGarmentType === 'SHORT'}
                      onChange={(e) => setBulkNecklineType(e.target.value as NecklineType)}
                    >
                      <option value="REDONDO">REDONDO</option>
                      <option value="V">CUELLO V</option>
                    </Select>
                  </div>

                  {/* Talla (Desplegable) */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono text-slate-500 font-bold block">
                      Talla (Opcional):
                    </label>
                    <Select
                      sizeVariant="sm"
                      value={bulkSizeName}
                      onChange={(e) => setBulkSizeName(e.target.value)}
                    >
                      <option value="">Mantener individual</option>
                      {availableSizes.map((sz) => (
                        <option key={sz} value={sz}>
                          {sz}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {/* Cantidad */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono text-slate-500 font-bold block">
                      Cantidad:
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={bulkQuantity}
                      onChange={(e) => setBulkQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 text-center font-mono focus:outline-none focus:border-violet-500 shadow-2xs"
                    />
                  </div>

                  {/* Botón Aplicar a Todos */}
                  <div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleExecuteMassEdit}
                      className="w-full h-[34px]"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Aplicar a Todos</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. TABLA DE NÓMINA */}
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
            {/* Barra superior de la tabla con botón + Agregar Jugador */}
            <div className="px-4 py-2.5 bg-slate-50/70 border-b border-slate-200/70 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">
                  Nómina de Jugadores ({items.length})
                </span>
                <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                  • Edición directa de tallas, dorsales y prendas
                </span>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleAddPlayer}
                className="cursor-pointer shadow-xs"
                title="Agregar un nuevo jugador a la nómina"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Jugador</span>
              </Button>
            </div>

            <div className="overflow-x-auto max-h-[480px] scroll-smooth">
              <table className="w-full min-w-[760px] text-left text-xs font-sans">
                <thead className="bg-slate-50 text-slate-500 sticky top-0 border-b border-slate-200 z-10 text-[11px] uppercase tracking-wider font-mono">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center">#</th>
                    <th className="py-2.5 px-3 w-28">Talla</th>
                    <th className="py-2.5 px-3 w-16 text-center">Cant.</th>
                    <th className="py-2.5 px-3 min-w-[140px]">Nombre Dorsal</th>
                    <th className="py-2.5 px-3 w-20 text-center">Número</th>
                    <th className="py-2.5 px-3 w-36">Tipo Prenda</th>
                    <th className="py-2.5 px-3 w-28">Cuello</th>
                    <th className="py-2.5 px-3 min-w-[170px]">Validación / Estado</th>
                    <th className="py-2.5 px-3 w-12 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 px-4 text-center">
                        <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-3">
                          <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-100 shadow-2xs">
                            <Users className="w-6 h-6" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-slate-700">No hay jugadores en la nómina</p>
                            <p className="text-xs text-slate-400">
                              Importa un archivo Excel o agrega tu primer jugador directamente en la tabla.
                            </p>
                          </div>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={handleAddPlayer}
                            className="cursor-pointer shadow-xs"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Agregar Primer Jugador</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={`h-[38px] hover:bg-slate-50/80 transition-colors ${
                        !item.isValid ? 'bg-red-50/30' : ''
                      }`}
                    >
                      {/* # */}
                      <td className="py-1 px-3 text-center text-slate-400 font-mono text-[11px] font-bold">
                        {idx + 1}
                      </td>

                      {/* Talla */}
                      <td className="py-1 px-3">
                        <Select
                          sizeVariant="sm"
                          value={item.sizeName}
                          hasError={item.errors.some((e) => e.field === 'sizeName')}
                          onChange={(e) => updateItem(item.id, { sizeName: e.target.value })}
                          className="font-bold font-mono text-xs"
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
                        </Select>
                      </td>

                      {/* Cantidad */}
                      <td className="py-1 px-3 text-center">
                        <input
                          type="number"
                          min="1"
                          max="999"
                          value={item.quantity || 1}
                          onChange={(e) =>
                            updateItem(item.id, {
                              quantity: Math.max(1, parseInt(e.target.value) || 1),
                            })
                          }
                          className="w-14 bg-white border border-slate-200 rounded-lg px-1.5 py-1 text-center font-mono text-xs text-slate-800 focus:outline-none focus:border-violet-500 shadow-2xs"
                        />
                      </td>

                      {/* Nombre Dorsal */}
                      <td className="py-1 px-3">
                        <input
                          type="text"
                          value={item.playerName}
                          onChange={(e) => updateItem(item.id, { playerName: e.target.value })}
                          className={`w-full bg-white border rounded-lg px-2.5 py-1 uppercase font-semibold text-xs focus:outline-none focus:border-violet-500 shadow-2xs ${
                            item.errors.some((e) => e.field === 'playerName')
                              ? 'border-red-400 text-red-600 bg-red-50/50'
                              : 'border-slate-200 text-slate-900'
                          }`}
                        />
                      </td>

                      {/* Número Dorsal */}
                      <td className="py-1 px-3 text-center">
                        <input
                          type="text"
                          placeholder="—"
                          value={item.playerNumber}
                          onChange={(e) => updateItem(item.id, { playerNumber: e.target.value })}
                          className={`w-16 mx-auto block bg-white border rounded-lg px-2 py-1 text-center font-mono font-bold text-xs focus:outline-none focus:border-violet-500 shadow-2xs ${
                            item.errors.some((e) => e.field === 'playerNumber')
                              ? 'border-red-400 text-red-600 bg-red-50/50'
                              : 'border-slate-200 text-violet-700 placeholder:text-slate-300'
                          }`}
                        />
                      </td>

                      {/* Tipo Prenda */}
                      <td className="py-1 px-3">
                        <Select
                          sizeVariant="sm"
                          value={item.garmentType}
                          onChange={(e) => updateItem(item.id, { garmentType: e.target.value as GarmentType })}
                          className="text-xs font-medium"
                        >
                          <option value="COMPLETO">COMPLETO (6 pzs)</option>
                          <option value="CAMISETA">CAMISETA (4 pzs)</option>
                          <option value="SHORT">SHORT (2 pzs)</option>
                        </Select>
                      </td>

                      {/* Cuello */}
                      <td className="py-1 px-3">
                        <Select
                          sizeVariant="sm"
                          value={item.necklineType || 'REDONDO'}
                          disabled={item.garmentType === 'SHORT'}
                          onChange={(e) => updateItem(item.id, { necklineType: e.target.value as NecklineType })}
                          className="text-xs font-medium"
                        >
                          <option value="REDONDO">REDONDO</option>
                          <option value="V">CUELLO V</option>
                        </Select>
                      </td>

                      {/* Validación / Estado */}
                      <td className="py-1 px-3 text-[11px]">
                        {item.errors.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {item.errors.map((err, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200"
                                title={err.message}
                              >
                                <AlertCircle className="w-3 h-3 shrink-0 text-red-500" />
                                <span className="truncate max-w-[200px]">{err.message}</span>
                              </span>
                            ))}
                          </div>
                        ) : item.warnings.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {item.warnings.map((warn, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200"
                                title={warn.message}
                              >
                                <AlertTriangle className="w-3 h-3 shrink-0 text-amber-500" />
                                <span className="truncate max-w-[180px]">{warn.message}</span>
                              </span>
                            ))}
                          </div>
                        ) : item.playerNumber ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-violet-50 text-violet-700 border border-violet-200/70">
                            Dorsal #{item.playerNumber}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200/80">
                            Solo nombre
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-1 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Eliminar jugador"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              </table>
            </div>

            {/* Pie de tabla con botón + Agregar otra fila */}
            <div className="px-4 py-2 bg-slate-50/60 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
              <span className="text-[11px] text-slate-400 font-medium font-mono">
                {items.length} {items.length === 1 ? 'jugador registrado' : 'jugadores registrados'}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddPlayer}
                className="cursor-pointer text-xs"
                title="Agregar otra fila a la nómina"
              >
                <Plus className="w-3.5 h-3.5 text-violet-600" />
                <span>Agregar otra fila</span>
              </Button>
            </div>
          </div>
        </div>

      {/* 5. BARRA INFERIOR DE ACCIÓN (CTA) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs">
        <div className="space-y-1">
          <div className="text-xs text-slate-600">
            {items.length === 0 ? (
              <span className="text-slate-600 font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                Carga un archivo Excel o agrega jugadores para habilitar la generación de producción.
              </span>
            ) : summary.hasErrors ? (
              <span className="text-red-600 font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                Corrige los {summary.invalidCount} errores en la nómina (incompatibilidad de molde o diseño) antes de proceder a la generación.
              </span>
            ) : missingProductionSetup.length > 0 ? (
              <span className="text-amber-600 font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                La nómina es válida, pero falta {missingProductionSetup.join(' y ')} para poder generar las prendas.
              </span>
            ) : (summary.warningCount || 0) > 0 ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                Todos los {summary.validCount} registros son válidos ({summary.warningCount} con ajuste de texto largo).
              </span>
            ) : (
              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                Todos los {summary.validCount} registros son válidos y listos para producción.
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Molde:</span>
              {currentPatternSet ? (
                <span className="text-violet-700 font-semibold px-2 py-0.5 bg-violet-50 rounded-md border border-violet-200">
                  {currentPatternSet.name}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setCurrentView('PATTERNS')}
                  className="text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
                  title="Ir a Moldes para seleccionar o cargar un patrón"
                >
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                  <span>Sin Molde (Ir a Moldes)</span>
                </button>
              )}
            </span>
            <span className="text-slate-300">•</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Diseño:</span>
              {currentDesign ? (
                <span className="text-violet-700 font-semibold px-2 py-0.5 bg-violet-50 rounded-md border border-violet-200">
                  {currentDesign.name}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setCurrentView('DESIGNS')}
                  className="text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
                  title="Ir a Diseños para seleccionar o cargar artes"
                >
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                  <span>Sin Diseño (Ir a Diseños)</span>
                </button>
              )}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-stretch md:items-end gap-2">
          <Button
            variant="primary"
            size="md"
            disabled={!canProceedToNesting || isGeneratingAction}
            isLoading={isGeneratingAction}
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

                // Generar prendas con el store asegurando producción completa (camisetas y shorts)
                useGeneratorStore.getState().updateConfig({ productionScope: 'ALL' });
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
                showAlert.toast(
                  'success',
                  `¡${generatedPieces.length} piezas vectoriales generadas! Revisa los dorsales y ajustes en la pestaña de inspección.`
                );
                setCurrentView('NESTING');
              } finally {
                setIsGeneratingAction(false);
              }
            }}
            title={
              !canProceedToNesting
                ? (disabledReasonMessage || 'Completa la nómina para generar prendas')
                : 'Genera la producción completa de piezas vectoriales 1:1 y avanza al entallado y acomodo en rollo'
            }
            className="px-5 py-2.5 h-auto text-xs sm:text-sm font-semibold cursor-pointer"
          >
            {isGeneratingAction ? (
              <span>Generando uniformes 1:1...</span>
            ) : (
              <>
                <span>Generar Producción Completa</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>

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
