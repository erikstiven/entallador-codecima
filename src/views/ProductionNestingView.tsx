import React, { useState } from 'react';
import { 
  Play, 
  RotateCw, 
  Lock, 
  Unlock, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Download, 
  Gauge, 
  Ruler, 
  Layers,
  Sparkles
} from 'lucide-react';
import { useProfileStore } from '@/modules/settings/profileStore';

export const ProductionNestingView: React.FC = () => {
  const { activeProfile } = useProfileStore();
  const [nestingMode, setNestingMode] = useState<'MAX_SAVINGS' | 'BY_SIZE' | 'BY_PLAYER' | 'MANUAL'>('MAX_SAVINGS');
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-950 overflow-hidden select-none">
      {/* Top Nesting Control Ribbon */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-2.5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* Nesting Mode Selector */}
          <div className="flex items-center bg-slate-950 border border-slate-700/80 rounded-lg p-1 text-xs">
            <button
              onClick={() => setNestingMode('MAX_SAVINGS')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                nestingMode === 'MAX_SAVINGS'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Máximo Ahorro
            </button>
            <button
              onClick={() => setNestingMode('BY_SIZE')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                nestingMode === 'BY_SIZE'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Por Talla
            </button>
            <button
              onClick={() => setNestingMode('BY_PLAYER')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                nestingMode === 'BY_PLAYER'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Por Jugador
            </button>
          </div>

          <div className="h-6 w-px bg-slate-800" />

          {/* Action Buttons */}
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-950 transition-colors">
            <Play className="w-3.5 h-3.5 fill-current" />
            Optimizar Nesting
          </button>

          <button className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            Reoptimizar Resto (Respetar 🔒)
          </button>
        </div>

        {/* Viewport Zoom & Export */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-950 border border-slate-700 rounded-lg p-1 text-xs text-slate-400">
            <button
              onClick={() => setZoomLevel((z) => Math.max(z - 10, 20))}
              className="p-1 hover:text-white hover:bg-slate-800 rounded"
              title="Reducir zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px] text-slate-200">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(z + 10, 300))}
              className="p-1 hover:text-white hover:bg-slate-800 rounded"
              title="Aumentar zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(100)}
              className="px-2 py-0.5 hover:text-white hover:bg-slate-800 rounded font-mono text-[10px]"
              title="Escala 1:1"
            >
              100%
            </button>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-sky-950 transition-colors">
            <Download className="w-3.5 h-3.5" />
            Exportar para RasterLink
          </button>
        </div>
      </div>

      {/* Production Metrics Strip */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-6 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>Prendas: <strong className="text-white font-mono">35</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Piezas: <strong className="text-white font-mono">172</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Ruler className="w-3.5 h-3.5 text-slate-500" />
            <span>Ancho Útil: <strong className="text-emerald-400 font-mono">{activeProfile.printableWidthMm} mm</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Largo Estimado: <strong className="text-white font-mono">18.42 m</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Aprovechamiento:</span>
            <span className="text-emerald-400 font-mono font-bold text-sm">87.6%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Desperdicio:</span>
            <span className="text-amber-400 font-mono text-xs">12.4%</span>
          </div>
        </div>
      </div>

      {/* Interactive CAD Canvas Area */}
      <div className="flex-1 relative bg-[#0b0f19] overflow-auto flex justify-center p-8">
        {/* Paper Roll Mockup Container */}
        <div 
          className="bg-slate-900 border-2 border-emerald-500/40 shadow-2xl relative transition-transform origin-top"
          style={{
            width: `${activeProfile.printableWidthMm * 0.75}px`,
            minHeight: '1200px',
            boxShadow: '0 0 50px rgba(0,0,0,0.8)'
          }}
        >
          {/* Top Millimeter Ruler Guide */}
          <div className="h-6 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between px-3 text-[10px] font-mono text-slate-400 select-none">
            <span>0 mm</span>
            <span className="text-emerald-400 font-semibold">{activeProfile.name}</span>
            <span>{activeProfile.printableWidthMm} mm</span>
          </div>

          {/* Roll Watermark / Center Guidance */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
            <div className="text-center">
              <Sparkles className="w-24 h-24 mx-auto text-emerald-400 mb-2" />
              <div className="text-2xl font-bold font-mono tracking-widest text-white">
                ÁREA ÚTIL DE IMPRESIÓN {activeProfile.printableWidthMm} MM
              </div>
              <div className="text-sm text-slate-300 font-mono">ESCALA FÍSICA 1:1 CALIBRADA</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
