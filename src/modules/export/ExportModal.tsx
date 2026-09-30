import React, { useState } from 'react';
import { 
  X, 
  Download, 
  FileText, 
  Printer, 
  Sparkles, 
  CheckCircle2, 
  Scissors, 
  Ruler
} from 'lucide-react';
import { ExportFormat, ExportOptions } from './types';
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
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('SVG');
  const includeCutContour = false;
  const [includeSeamLabels] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>(
    `PRODUCCION_UNIFORMES_${new Date().toISOString().slice(0, 10)}`
  );
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);

  if (!isOpen || !nestingResult || placedPieces.length === 0) return null;

  const totalLengthM = (nestingResult.totalRollLengthMm / 1000.0).toFixed(2);
  const efficiency = nestingResult.utilizationPercent.toFixed(1);
  const hasEmbeddedRaster = placedPieces.some((piece) => /<image\b/i.test(piece.svgContent || ''));

  const handleExport = async () => {
    setIsExporting(true);
    setExportSuccess(false);

    try {
      const options: ExportOptions = {
        format: selectedFormat,
        fileName: fileName.trim() || 'PRODUCCION_TEXTIL',
        ripProfile: 'MIMAKI_RASTERLINK',
        includeCutContour,
        cutContourColor: '#ff0000',
        cutContourWidthMm: 0.25,
        includeSeamLabels,
        paperRollWidthMm: printableWidthMm,
        totalRollLengthMm: nestingResult.totalRollLengthMm,
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
      setTimeout(() => setExportSuccess(false), 3000);
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
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-950 border border-sky-500/40 text-sky-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Exportar Bobina para Impresión
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-mono">
                  Escala física 1:1
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Archivos de producción a tamaño real para Illustrator y software RIP
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Format Selection Cards */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-semibold text-slate-300 block">Formato</label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Option 1: SVG Vectorial (Recomendado para Illustrator) */}
              <div
                onClick={() => setSelectedFormat('SVG')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedFormat === 'SVG'
                    ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>SVG 1:1 (Illustrator)</span>
                  </div>
                  <span className="text-[10px] bg-emerald-900/60 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold">
                    Recomendado
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Conserva el arte, los colores, nombres, números y la distribución física del rollo.
                </p>
              </div>

              {/* Option 2: PDF para RasterLink */}
              <div
                onClick={() => setSelectedFormat('PDF')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedFormat === 'PDF'
                    ? 'bg-sky-950/40 border-sky-500 ring-2 ring-sky-500/30 shadow-lg'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <FileText className="w-4 h-4 text-sky-400" />
                    <span>PDF RasterLink</span>
                  </div>
                  <span className="text-[10px] bg-sky-900/60 text-sky-300 px-1.5 py-0.5 rounded font-mono">
                    Para RIP / Plotter
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Archivo de impresión 1:1 con el mismo arte visible del SVG.
                </p>
              </div>

            </div>
          </div>

          {hasEmbeddedRaster && (
            <p className="text-[11px] leading-relaxed text-amber-300 bg-amber-950/30 border border-amber-800/50 rounded-lg px-3 py-2">
              El diseño contiene imágenes incrustadas. Se conservarán tal como fueron cargadas; su nitidez depende de la resolución del archivo original.
            </p>
          )}

          {/* File Name */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Nombre del Archivo
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
            />
          </div>

          {/* Summary Strip */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <Ruler className="w-4 h-4 text-emerald-400" />
              <span>Dimensiones: <strong className="text-white font-mono">{printableWidthMm} mm × {totalLengthM} m</strong></span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Scissors className="w-4 h-4 text-sky-400" />
              <span>Piezas: <strong className="text-white font-mono">{placedPieces.length}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <span>Eficiencia: <strong className="text-emerald-400 font-mono">{efficiency}%</strong></span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            Cancelar
          </button>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all ${
              exportSuccess
                ? 'bg-emerald-600 text-white shadow-emerald-950'
                : isExporting
                ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-950 cursor-pointer active:scale-95'
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
