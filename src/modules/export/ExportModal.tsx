import React, { useState } from 'react';
import { 
  X, 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Printer, 
  Sparkles, 
  CheckCircle2, 
  Scissors, 
  Layers, 
  Ruler,
  AlertCircle
} from 'lucide-react';
import { ExportFormat, RipProfileType, ExportOptions } from './types';
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
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('PDF');
  const [ripProfile, setRipProfile] = useState<RipProfileType>('MIMAKI_RASTERLINK');
  const [includeCutContour, setIncludeCutContour] = useState<boolean>(true);
  const [includeSeamLabels, setIncludeSeamLabels] = useState<boolean>(true);
  const [fileName, setFileName] = useState<string>(
    `PRODUCCION_UNIFORMES_${new Date().toISOString().slice(0, 10)}`
  );
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);

  if (!isOpen || !nestingResult || placedPieces.length === 0) return null;

  const totalLengthM = (nestingResult.totalRollLengthMm / 1000.0).toFixed(2);
  const efficiency = nestingResult.utilizationPercent.toFixed(1);

  const handleExport = async () => {
    setIsExporting(true);
    setExportSuccess(false);

    try {
      const options: ExportOptions = {
        format: selectedFormat,
        fileName: fileName.trim() || 'PRODUCCION_TEXTIL',
        ripProfile,
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
      alert('Error generando el archivo de exportación.');
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
                  Escala 1:1 Físico
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Archivos vectoriales puros calibrados para Mimaki RasterLink, Epson y mesa de corte
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
            <label className="text-xs font-semibold text-slate-300 block mb-2.5">
              Selecciona el Formato de Salida
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Option 1: PDF para RasterLink */}
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
                    Recomendado
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Página continua 1:1 calibrada para Mimaki RasterLink 6/7 y Epson Edge Print.
                </p>
              </div>

              {/* Option 2: SVG Vectorial */}
              <div
                onClick={() => setSelectedFormat('SVG')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedFormat === 'SVG'
                    ? 'bg-sky-950/40 border-sky-500 ring-2 ring-sky-500/30 shadow-lg'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>SVG 1:1 (Illustrator)</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Dimensiones en mm reales. Listo para abrir y revisar en Adobe Illustrator o CorelDRAW.
                </p>
              </div>

              {/* Option 3: EPS PostScript */}
              <div
                onClick={() => setSelectedFormat('EPS')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedFormat === 'EPS'
                    ? 'bg-sky-950/40 border-sky-500 ring-2 ring-sky-500/30 shadow-lg'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <Printer className="w-4 h-4 text-purple-400" />
                    <span>EPS PostScript</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Encapsulated PostScript Level 3 para RIPs y plotters legados con BoundingBox exacto.
                </p>
              </div>

              {/* Option 4: Excel y CSV */}
              <div
                onClick={() => setSelectedFormat('EXCEL_SUMMARY')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedFormat === 'EXCEL_SUMMARY'
                    ? 'bg-sky-950/40 border-sky-500 ring-2 ring-sky-500/30 shadow-lg'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span>Excel Resumen Taller</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Hoja de cálculo con detalle de corte por jugador, consumos y desglose por talla.
                </p>
              </div>
            </div>
          </div>

          {/* Options for PDF / SVG */}
          {selectedFormat !== 'EXCEL_SUMMARY' && selectedFormat !== 'CSV_SUMMARY' && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
              <span className="text-xs font-semibold text-slate-300 block">
                Opciones de Salida para Taller
              </span>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeCutContour}
                    onChange={(e) => setIncludeCutContour(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-600 bg-slate-900 border-slate-700"
                  />
                  <span>Trazado de corte exterior (Rojo 0.5 pt)</span>
                </label>

                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeSeamLabels}
                    onChange={(e) => setIncludeSeamLabels(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-600 bg-slate-900 border-slate-700"
                  />
                  <span>Etiquetas de confección en margen</span>
                </label>
              </div>

              {selectedFormat === 'PDF' && (
                <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Perfil RIP Objetivo:</span>
                  <select
                    value={ripProfile}
                    onChange={(e) => setRipProfile(e.target.value as RipProfileType)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                  >
                    <option value="MIMAKI_RASTERLINK">Mimaki RasterLink 6 / 7</option>
                    <option value="EPSON_EDGE_PRINT">Epson Edge Print</option>
                    <option value="GENERIC_RIP">RIP Genérico (Wasatch / Caldera)</option>
                  </select>
                </div>
              )}
            </div>
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
