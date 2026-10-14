import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  Printer, 
  CheckCircle2, 
  Scissors, 
  Ruler,
  Loader2,
  Layers,
  Info,
  AlertCircle,
  Tag
} from 'lucide-react';
import { ExportOptions, ExportResult } from './types';
import { exportProductionRoll, triggerFileDownload } from './exportService';
import { PlacedNestingPiece, NestingResult } from '@/core/nesting/types';
import { showAlert } from '@/core/ui/alerts';
import { checkInkscapeAvailability, isElectronEpsAvailable } from './epsConversionClient';
import { useSystemSettingsStore } from '@/modules/settings/systemSettingsStore';
import { useUnits } from '@/core/units/useUnits';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  placedPieces: PlacedNestingPiece[];
  nestingResult: NestingResult | null;
  printableWidthMm: number;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  placedPieces,
  nestingResult,
  printableWidthMm,
}) => {
  const { settings } = useSystemSettingsStore();
  const { format } = useUnits();

  const [fileName, setFileName] = useState<string>(
    `PRODUCCION_UNIFORMES_${new Date().toISOString().slice(0, 10)}`
  );
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportStepText, setExportStepText] = useState<string>('');
  const [exportProgressPercent, setExportProgressPercent] = useState<number>(0);
  const [exportSuccessDone, setExportSuccessDone] = useState<boolean>(false);
  const [downloadedFiles, setDownloadedFiles] = useState<ExportResult[]>([]);

  const [selectedFormat, setSelectedFormat] = useState<ExportOptions['format']>(
    settings.defaultExportFormat || 'SVG'
  );
  const includeCalibration = false;
  const includeCutContour = false;
  const [includeSeamLabels, setIncludeSeamLabels] = useState<boolean>(
    settings.autoIncludeLabels ?? true
  );
  const [exportAllSheets, setExportAllSheets] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      setSelectedFormat(settings.defaultExportFormat || 'SVG');
      setIncludeSeamLabels(settings.autoIncludeLabels ?? true);
    } else {
      setIsExporting(false);
      setExportStepText('');
      setExportProgressPercent(0);
      setExportSuccessDone(false);
      setDownloadedFiles([]);
    }
  }, [isOpen, settings.defaultExportFormat, settings.autoIncludeLabels]);

  if (!isOpen || !nestingResult || placedPieces.length === 0) return null;

  const sheets = nestingResult.sheets && nestingResult.sheets.length > 0 ? nestingResult.sheets : [];
  const hasMultipleSheets = sheets.length > 1 && selectedFormat !== 'EXCEL_SUMMARY';
  const targetSheetCount = hasMultipleSheets && exportAllSheets ? sheets.length : 1;

  const totalLengthM = (nestingResult.totalRollLengthMm / 1000.0).toFixed(2);
  const efficiency = nestingResult.utilizationPercent.toFixed(1);
  const formatDisplay = selectedFormat === 'EXCEL_SUMMARY' ? 'Excel' : selectedFormat;

  const handleClose = () => {
    if (isExporting) return;
    onClose();
  };

  const handleExport = async () => {
    if (isExporting) return;

    setIsExporting(true);
    setExportSuccessDone(false);
    setDownloadedFiles([]);
    setExportProgressPercent(12);
    setExportStepText('Paso 1/3: Verificando vectores y tipografías 1:1...');

    try {
      await new Promise((resolve) => setTimeout(resolve, 140));

      const baseFileName = fileName.trim() || 'PRODUCCION_TEXTIL';
      const generatedResults: ExportResult[] = [];

      if (hasMultipleSheets && exportAllSheets) {
        for (let idx = 0; idx < sheets.length; idx++) {
          const sheet = sheets[idx];
          const stepStartPct = Math.round(25 + (idx / sheets.length) * 60);
          setExportProgressPercent(stepStartPct);
          setExportStepText(
            `Paso 2/3: Generando pliego PARTE ${idx + 1} de ${sheets.length} en escala real...`
          );
          await new Promise((resolve) => setTimeout(resolve, 100));

          const sheetHeightMm = Math.max(
            100,
            sheet.heightMm ||
              sheet.placedPieces.reduce((max, p) => Math.max(max, p.yMm + p.effectiveHeightMm), 0) + 15
          );

          const sheetOptions: ExportOptions = {
            format: selectedFormat,
            fileName: `${baseFileName}_PARTE_${idx + 1}`,
            ripProfile: 'MIMAKI_RASTERLINK',
            includeCutContour,
            cutContourColor: '#ff0000',
            cutContourWidthMm: 0.25,
            includeSeamLabels,
            includeCalibrationSquare: includeCalibration,
            paperRollWidthMm: sheet.widthMm || printableWidthMm,
            totalRollLengthMm: sheetHeightMm,
          };

          const result = await exportProductionRoll(
            {
              placedPieces: sheet.placedPieces,
              nestingResult,
              projectName: `${baseFileName}_PARTE_${idx + 1}`,
            },
            sheetOptions
          );

          triggerFileDownload(result);
          generatedResults.push(result);
        }
      } else {
        setExportProgressPercent(52);
        setExportStepText(
          `Paso 2/3: Generando pliego PARTE 1 de 1 en escala real (${formatDisplay} 1:1)...`
        );
        await new Promise((resolve) => setTimeout(resolve, 120));

        const effectiveSheetHeightMm = Math.max(
          100,
          placedPieces.reduce((max, p) => Math.max(max, p.yMm + p.effectiveHeightMm), 0) + 15
        );

        const options: ExportOptions = {
          format: selectedFormat,
          fileName: baseFileName,
          ripProfile: 'MIMAKI_RASTERLINK',
          includeCutContour,
          cutContourColor: '#ff0000',
          cutContourWidthMm: 0.25,
          includeSeamLabels,
          includeCalibrationSquare: includeCalibration,
          paperRollWidthMm: printableWidthMm,
          totalRollLengthMm: effectiveSheetHeightMm,
        };

        const result = await exportProductionRoll(
          {
            placedPieces,
            nestingResult,
            projectName: baseFileName,
          },
          options
        );

        setExportProgressPercent(88);
        setExportStepText('Paso 3/3: Iniciando descarga automática en tu equipo...');
        await new Promise((resolve) => setTimeout(resolve, 90));

        triggerFileDownload(result);
        generatedResults.push(result);
      }

      setExportProgressPercent(100);
      setExportStepText('¡Exportación completada! Archivos descargados.');
      setDownloadedFiles(generatedResults);
      setExportSuccessDone(true);

      showAlert.toast(
        'success',
        generatedResults.length > 1
          ? `¡${generatedResults.length} pliegos ${formatDisplay} 1:1 descargados con éxito!`
          : `¡Archivo ${formatDisplay} 1:1 descargado con éxito!`
      );
    } catch (err) {
      console.error('Error al exportar bobina:', err);
      const message = err instanceof Error ? err.message : 'No fue posible generar el archivo.';
      setExportStepText('');
      setExportProgressPercent(0);
      if (selectedFormat === 'EPS' && message.includes('No se encontró Inkscape')) {
        showAlert.error(
          'Motor Inkscape No Encontrado',
          'No se encontró Inkscape en el sistema.\n\nPara exportar en formato EPS es necesario instalar Inkscape (https://inkscape.org). La exportación SVG y PDF continúa disponible al 100%.'
        );
      } else {
        showAlert.error('Error al Exportar', message);
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-100 border border-violet-200 text-violet-700">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                Exportar Producción a Escala Real
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 border border-violet-200 font-mono">
                  {formatDisplay} 1:1
                </span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Archivo vectorial 1:1 listo para impresión en plotter / RIP / Illustrator
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isExporting}
            title={isExporting ? 'Espera a que termine la exportación' : 'Cerrar ventana'}
            className={`p-1.5 rounded-lg transition-colors ${
              isExporting
                ? 'text-slate-300 cursor-not-allowed opacity-50'
                : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100 cursor-pointer'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* File Name */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Nombre del Archivo de Salida
            </label>
            <input
              type="text"
              value={fileName}
              disabled={isExporting}
              onChange={(e) => {
                setFileName(e.target.value);
                setExportSuccessDone(false);
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:border-violet-500 focus:bg-white focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="PRODUCCION_UNIFORMES"
            />
          </div>

          {/* Format Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Formato de Exportación (Selecciona uno)
            </label>
            <div className="grid grid-cols-4 gap-2 text-xs">
              {(['SVG', 'PDF', 'EPS', 'EXCEL_SUMMARY'] as const).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  disabled={isExporting}
                  onClick={() => {
                    setSelectedFormat(fmt);
                    setExportSuccessDone(false);
                  }}
                  className={`py-2 px-1.5 rounded-xl border font-mono font-bold text-center transition-all ${
                    isExporting ? 'opacity-50 cursor-not-allowed ' : 'cursor-pointer '
                  }${
                    selectedFormat === fmt
                      ? 'bg-violet-600 text-white border-violet-500 shadow-sm'
                      : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  {fmt === 'EXCEL_SUMMARY' ? 'Excel' : `${fmt} 1:1`}
                </button>
              ))}
            </div>
            {selectedFormat === 'EPS' && (
              <div className="mt-2 p-2.5 rounded-xl bg-violet-50 border border-violet-200 text-[11px] text-violet-900 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-violet-600 shrink-0 mt-0.5" />
                <span>
                  <strong>EPS Level 3 (Curvas 1:1):</strong> Motor aislado vía Inkscape CLI para RIPs (Mimaki, Epson, Wasatch) y plotters industriales.
                </span>
              </div>
            )}
            {selectedFormat === 'SVG' && (
              <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                <span>
                  <strong>SVG Maestro 1:1:</strong> Vectorial nativo con degradados, máscaras y tipografías trazadas. Compatible directo con Illustrator.
                </span>
              </div>
            )}
          </div>

          {/* Selector de alcance cuando hay múltiples pliegos */}
          {sheets.length > 1 && selectedFormat !== 'EXCEL_SUMMARY' && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
              <div className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-violet-600" />
                Cantidad de Pliegos a Descargar
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={() => {
                    setExportAllSheets(true);
                    setExportSuccessDone(false);
                  }}
                  className={`py-2 px-2.5 rounded-xl border font-semibold text-left transition-all ${
                    isExporting ? 'opacity-50 cursor-not-allowed ' : 'cursor-pointer '
                  }${
                    exportAllSheets
                      ? 'bg-violet-600 text-white border-violet-500 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-bold">Todos ({sheets.length} Pliegos)</div>
                  <div className={`text-[10px] ${exportAllSheets ? 'text-violet-200' : 'text-slate-500'}`}>Descarga la orden completa</div>
                </button>
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={() => {
                    setExportAllSheets(false);
                    setExportSuccessDone(false);
                  }}
                  className={`py-2 px-2.5 rounded-xl border font-semibold text-left transition-all ${
                    isExporting ? 'opacity-50 cursor-not-allowed ' : 'cursor-pointer '
                  }${
                    !exportAllSheets
                      ? 'bg-violet-600 text-white border-violet-500 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-bold">Solo Vista Actual (1 Pliego)</div>
                  <div className={`text-[10px] ${!exportAllSheets ? 'text-violet-200' : 'text-slate-500'}`}>{placedPieces.length} piezas en pantalla</div>
                </button>
              </div>
            </div>
          )}

          {/* Opciones de Identificación */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
            <label
              className={`flex items-center gap-2.5 text-slate-700 ${
                isExporting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:text-slate-900'
              }`}
            >
              <input
                type="checkbox"
                checked={includeSeamLabels}
                disabled={isExporting}
                onChange={(e) => {
                  setIncludeSeamLabels(e.target.checked);
                  setExportSuccessDone(false);
                }}
                className="rounded border-slate-300 text-violet-600 focus:ring-violet-500 w-4 h-4 cursor-pointer"
              />
              <span className="flex items-center gap-1.5 font-medium">
                <Tag className="w-3.5 h-3.5 text-violet-600" />
                Incluir etiquetas de identificación de piezas fuera de la costura
              </span>
            </label>
          </div>

          {/* Summary Strip */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Ruler className="w-4 h-4 text-violet-600" />
              <span>
                <strong className="text-slate-900 font-mono">
                  {format(printableWidthMm)} × {totalLengthM} m
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Scissors className="w-4 h-4 text-sky-600" />
              <span>
                <strong className="text-slate-900 font-mono">{placedPieces.length} piezas</strong>
              </span>
            </div>
            <div className="font-mono">
              <span className="text-violet-700 font-bold">{efficiency}%</span> aprovechamiento
            </div>
          </div>

          {/* Panel de Progreso Paso a Paso durante la exportación */}
          {isExporting && (
            <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4 space-y-2.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-violet-900 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-violet-600 animate-spin shrink-0" />
                  {exportStepText || 'Procesando archivo de producción 1:1...'}
                </span>
                <span className="font-mono font-bold text-violet-700 bg-white px-2 py-0.5 rounded-lg border border-violet-200 shadow-xs">
                  {exportProgressPercent}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-violet-100 rounded-full overflow-hidden border border-violet-200">
                <div
                  className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 transition-all duration-200"
                  style={{ width: `${exportProgressPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-violet-700">
                Por favor espera unos segundos. Estamos preparando tus moldes a tamaño real (1:1) sin alterar medidas ni tipografías.
              </p>
            </div>
          )}

          {/* Banner Verde Claro de Confirmación al Terminar */}
          {exportSuccessDone && !isExporting && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 space-y-1.5 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{exportStepText || '¡Exportación completada! Archivos descargados.'}</span>
              </div>
              {downloadedFiles.length > 0 && (
                <div className="text-[11px] text-emerald-700 font-mono pl-6 space-y-0.5">
                  {downloadedFiles.map((f, i) => (
                    <div key={`${f.fileName}_${i}`} className="truncate">
                      • {f.fileName} ({f.totalPieces} piezas — {format(f.widthMm)} × {format(f.heightMm)})
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[11px] text-emerald-700/80 pl-6">
                Revisa tu carpeta de Descargas. El archivo está calibrado a escala 1:1 listo para imprimir.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isExporting}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors ${
              isExporting
                ? 'text-slate-300 cursor-not-allowed opacity-50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200 cursor-pointer'
            }`}
          >
            {exportSuccessDone ? 'Cerrar Ventana' : 'Cancelar'}
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all ${
              exportSuccessDone && !isExporting
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-emerald-200'
                : isExporting
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300'
                : 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-200 cursor-pointer active:scale-95'
            }`}
          >
            {exportSuccessDone && !isExporting ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                ¡Archivo 1:1 Descargado con Éxito!
              </>
            ) : isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
                {selectedFormat === 'EPS' && !exportProgressPercent
                  ? 'Procesando EPS con Inkscape...'
                  : `Generando archivo 1:1 (${exportProgressPercent}%)...`}
              </>
            ) : (
              <>
                <Download className="w-4 h-4 shrink-0" />
                {targetSheetCount > 1
                  ? `Descargar ${sheets.length} Pliegos en ${selectedFormat} 1:1`
                  : `Descargar ${formatDisplay} 1:1 para Impresión`}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

