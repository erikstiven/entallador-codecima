import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Printer, 
  CheckCircle2, 
  Scissors, 
  Ruler
} from 'lucide-react';
import { ExportOptions } from './types';
import { exportProductionRoll, triggerFileDownload } from './exportService';
import { PlacedNestingPiece, NestingResult } from '@/core/nesting/types';

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
  const [fileName, setFileName] = useState<string>(
    `PRODUCCION_UNIFORMES_${new Date().toISOString().slice(0, 10)}`
  );
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);

  const [selectedFormat, setSelectedFormat] = useState<ExportOptions['format']>('SVG');
  const [includeCalibration, setIncludeCalibration] = useState<boolean>(true);
  const [includeCutContour, setIncludeCutContour] = useState<boolean>(false);

  if (!isOpen || !nestingResult || placedPieces.length === 0) return null;

  const totalLengthM = (nestingResult.totalRollLengthMm / 1000.0).toFixed(2);
  const efficiency = nestingResult.utilizationPercent.toFixed(1);

  const handleExport = async () => {
    setIsExporting(true);
    setExportSuccess(false);

    try {
      const effectiveSheetHeightMm = Math.max(
        100,
        placedPieces.reduce((max, p) => Math.max(max, p.yMm + p.effectiveHeightMm), 0) + 15
      );

      const options: ExportOptions = {
        format: selectedFormat,
        fileName: fileName.trim() || 'PRODUCCION_TEXTIL',
        ripProfile: 'MIMAKI_RASTERLINK',
        includeCutContour,
        cutContourColor: '#ff0000',
        cutContourWidthMm: 0.25,
        includeSeamLabels: false,
        includeCalibrationSquare: includeCalibration,
        paperRollWidthMm: printableWidthMm,
        totalRollLengthMm: effectiveSheetHeightMm,
      };

      const result = await exportProductionRoll(
        {
          placedPieces,
          nestingResult,
          projectName: fileName,
        },
        options
      );

      triggerFileDownload(result);
      setExportSuccess(true);
      setTimeout(() => {
        setExportSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error al exportar bobina:', err);
      const message = err instanceof Error ? err.message : 'No fue posible generar el archivo.';
      alert(`Error de exportación: ${message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-950 border border-violet-500/40 text-purple-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Exportar para Illustrator / RIP
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-violet-500/40 font-mono">
                  {selectedFormat} 1:1
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Archivo vectorial a escala física real con curvas nativas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* File Name */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Nombre del Archivo
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-violet-500 focus:outline-none"
              placeholder="PRODUCCION_UNIFORMES"
            />
          </div>

          {/* Format Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Formato de Exportación
            </label>
            <div className="grid grid-cols-4 gap-2 text-xs">
              {(['SVG', 'PDF', 'EPS', 'EXCEL_SUMMARY'] as const).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setSelectedFormat(fmt)}
                  className={`py-2 px-1.5 rounded-lg border font-mono font-bold text-center transition-all cursor-pointer ${
                    selectedFormat === fmt
                      ? 'bg-violet-600 text-white border-violet-400 shadow-md'
                      : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800'
                  }`}
                >
                  {fmt === 'EXCEL_SUMMARY' ? 'Excel' : fmt}
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={includeCalibration}
                onChange={(e) => setIncludeCalibration(e.target.checked)}
                className="rounded border-slate-700 text-violet-600 w-3.5 h-3.5"
              />
              <span className="font-semibold flex items-center gap-1">
                <Ruler className="w-3.5 h-3.5 text-purple-400" />
                Incluir cuadro de calibración física (100 × 100 mm)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={includeCutContour}
                onChange={(e) => setIncludeCutContour(e.target.checked)}
                className="rounded border-slate-700 text-violet-600 w-3.5 h-3.5"
              />
              <span>Incluir línea técnica de corte (Contorno)</span>
            </label>
          </div>

          {/* Summary Strip */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <Ruler className="w-4 h-4 text-purple-400" />
              <span><strong className="text-white font-mono">{printableWidthMm} mm × {totalLengthM} m</strong></span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Scissors className="w-4 h-4 text-sky-400" />
              <span><strong className="text-white font-mono">{placedPieces.length} piezas</strong></span>
            </div>
            <div className="text-slate-400 font-mono">
              <span className="text-purple-400 font-bold">{efficiency}%</span> uso
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all ${
              exportSuccess
                ? 'bg-violet-600 text-white shadow-purple-950'
                : isExporting
                ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                : 'bg-violet-600 hover:bg-violet-500 text-white shadow-purple-950 cursor-pointer active:scale-95'
            }`}
          >
            {exportSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                ¡Archivo Descargado!
              </>
            ) : isExporting ? (
              'Generando Vectorial 1:1...'
            ) : (
              <>
                <Download className="w-4 h-4" />
                Descargar {selectedFormat} (1:1)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
