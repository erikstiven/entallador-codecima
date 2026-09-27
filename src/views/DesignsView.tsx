import React, { useEffect, useState } from 'react';
import { 
  Palette, 
  Plus, 
  Layers, 
  Sliders, 
  Trash2, 
  CheckCircle2, 
  Sparkles, 
  Type, 
  Ruler,
  AlertTriangle,
  Eye
} from 'lucide-react';
import { useDesignStore } from '@/modules/designs/designStore';
import { MasterDesign } from '@/modules/designs/types';
import { computeTextFitting } from '@/core/fonts/textVectorEngine';

export const DesignsView: React.FC = () => {
  const {
    designs,
    activeDesign,
    loadDesignsFromDatabase,
    createDesign,
    setActiveDesign,
    deleteDesign,
    updatePlaceholderRule,
  } = useDesignStore();

  // Estado para la prueba en vivo de placeholders
  const [testPlayerName, setTestPlayerName] = useState<string>('CHRISTOPHER');
  const [testPlayerNumber, setTestPlayerNumber] = useState<string>('9');

  // Estado para crear nuevo diseño
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [newDesignName, setNewDesignName] = useState<string>('');
  const [newDesignSport, setNewDesignSport] = useState<string>('FUTBOL');
  const [color1, setColor1] = useState<string>('#ea580c');
  const [color2, setColor2] = useState<string>('#0284c7');
  const [color3, setColor3] = useState<string>('#ffffff');

  useEffect(() => {
    loadDesignsFromDatabase();
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesignName.trim()) return;

    createDesign(newDesignName.trim(), newDesignSport, [color1, color2, color3]);
    setNewDesignName('');
    setIsCreating(false);
  };

  const currentArtwork = activeDesign?.pieceArtworks['ESPALDA'];
  const nameRule = currentArtwork?.placeholders.find((p) => p.id === 'NOMBRE');
  const numberRule = currentArtwork?.placeholders.find((p) => p.id.includes('NUMERO'));

  const nameFitting = nameRule ? computeTextFitting(testPlayerName, nameRule) : null;
  const numberFitting = numberRule ? computeTextFitting(testPlayerNumber, numberRule) : null;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Biblioteca de Diseños Maestros</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Registra y gestiona los patrones artísticos base con reglas de dorsales y placeholders dinámicos
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-950 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Registrar Nuevo Diseño
        </button>
      </div>

      {/* Modal para crear diseño */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Crear Nuevo Diseño Maestro</h3>
            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Nombre del Diseño:</label>
                <input
                  type="text"
                  value={newDesignName}
                  onChange={(e) => setNewDesignName(e.target.value)}
                  placeholder="Ej: Barcelona Blaugrana 2026"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Deporte:</label>
                <select
                  value={newDesignSport}
                  onChange={(e) => setNewDesignSport(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="FUTBOL">Fútbol</option>
                  <option value="BASKET">Básquetbol</option>
                  <option value="VOLEY">Voleibol</option>
                  <option value="CICLISMO">Ciclismo</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Paleta de Colores:</label>
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-0.5">Principal</span>
                    <input
                      type="color"
                      value={color1}
                      onChange={(e) => setColor1(e.target.value)}
                      className="w-10 h-10 rounded border border-slate-700 bg-transparent cursor-pointer"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-0.5">Secundario</span>
                    <input
                      type="color"
                      value={color2}
                      onChange={(e) => setColor2(e.target.value)}
                      className="w-10 h-10 rounded border border-slate-700 bg-transparent cursor-pointer"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-0.5">Dorsales</span>
                    <input
                      type="color"
                      value={color3}
                      onChange={(e) => setColor3(e.target.value)}
                      className="w-10 h-10 rounded border border-slate-700 bg-transparent cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
                >
                  Guardar Diseño
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Grid: Design Cards and Live Preview Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Design Cards List */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Diseños Registrados ({designs.length})
          </h3>

          <div className="space-y-3">
            {designs.map((d) => {
              const isSelected = activeDesign?.id === d.id;
              return (
                <div
                  key={d.id}
                  onClick={() => setActiveDesign(d)}
                  className={`bg-slate-900 border rounded-xl p-4 cursor-pointer transition-all hover:border-slate-600 ${
                    isSelected
                      ? 'border-emerald-500 shadow-md shadow-emerald-950/40 bg-slate-850'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">{d.name}</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      {d.sport}
                    </span>
                  </div>

                  {/* Swatches */}
                  <div className="flex items-center gap-1.5 mt-3">
                    {d.colors.map((c, i) => (
                      <span
                        key={i}
                        className="w-4 h-4 rounded-full border border-slate-700 shadow-sm"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                    <span className="text-[11px] text-slate-500 ml-auto font-mono">
                      {Object.keys(d.pieceArtworks).length} piezas
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Live Interactive Jersey Preview & Placeholder Testing Studio */}
        {activeDesign && (
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <h3 className="text-base font-bold text-white">{activeDesign.name}</h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Estudio de previsualización en vivo y ajuste automático de dorsales
                  </p>
                </div>
                <button
                  onClick={() => deleteDesign(activeDesign.id)}
                  className="p-2 hover:bg-slate-800 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
                  title="Eliminar este diseño"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Interactive Player Name & Number Testing Controls */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">
                    Prueba en Vivo — Nombre Jugador:
                  </label>
                  <input
                    type="text"
                    value={testPlayerName}
                    onChange={(e) => setTestPlayerName(e.target.value.toUpperCase())}
                    placeholder="Escribe un nombre..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-bold font-mono focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Prueba con "CAROL" (normal) o "CHRISTOPHER" (compresión automática).
                  </span>
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">
                    Prueba en Vivo — Número Dorsal:
                  </label>
                  <input
                    type="text"
                    value={testPlayerNumber}
                    onChange={(e) => setTestPlayerNumber(e.target.value)}
                    placeholder="Ej: 9, 10, 21"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-emerald-400 font-bold font-mono focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Altura reglamentaria en espalda: 220 mm (22 cm).
                  </span>
                </div>
              </div>

              {/* Live Vector Jersey Simulation Stage */}
              <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-8 flex flex-col items-center justify-center relative overflow-hidden">
                {/* SVG Silhouette representation with master design art and placeholders */}
                <svg
                  viewBox="0 0 500 700"
                  className="w-72 max-w-full drop-shadow-2xl select-none"
                  style={{ filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.7))' }}
                >
                  <defs>
                    <clipPath id="jerseyClip">
                      <path d="M 50,50 L 150,50 C 180,90 220,90 250,50 L 350,50 C 340,110 320,180 290,220 L 310,650 L 90,650 L 110,220 C 80,180 60,110 50,50 Z" />
                    </clipPath>
                    <linearGradient id="jerseyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={activeDesign.colors[0] || '#ea580c'} />
                      <stop offset="100%" stopColor={activeDesign.colors[1] || '#0284c7'} />
                    </linearGradient>
                  </defs>

                  {/* Base Body with Clipping Mask */}
                  <g clipPath="url(#jerseyClip)">
                    {/* Master Design Pattern Layer */}
                    <rect width="500" height="700" fill="url(#jerseyGrad)" />
                    {/* Graphic Dynamic Accents */}
                    <path d="M 0,220 L 500,320 L 500,360 L 0,260 Z" fill={activeDesign.colors[1] || '#0284c7'} opacity="0.4" />
                    <path d="M 0,420 L 500,520 L 500,560 L 0,460 Z" fill={activeDesign.colors[2] || '#ffffff'} opacity="0.3" />

                    {/* Vectorized Name Placeholder */}
                    {nameFitting && (
                      <g dangerouslySetInnerHTML={{ __html: nameFitting.svgContent }} />
                    )}

                    {/* Vectorized Number Placeholder */}
                    {numberFitting && (
                      <g dangerouslySetInnerHTML={{ __html: numberFitting.svgContent }} />
                    )}
                  </g>

                  {/* Cut Contour Outline */}
                  <path
                    d="M 50,50 L 150,50 C 180,90 220,90 250,50 L 350,50 C 340,110 320,180 290,220 L 310,650 L 90,650 L 110,220 C 80,180 60,110 50,50 Z"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    opacity="0.5"
                  />
                </svg>

                {/* Auto-fitting Live Status Pill */}
                {nameFitting && (
                  <div className="mt-4 flex items-center gap-3 text-xs">
                    <span className="text-slate-400">Estado del Nombre:</span>
                    {nameFitting.isCompressed ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono text-[11px]">
                        <Sliders className="w-3.5 h-3.5" />
                        Compresión activa: {(nameFitting.scaleX * 100).toFixed(0)}% (Ancho: {nameFitting.fittedWidthMm.toFixed(1)} mm)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Escala 100% natural (Ancho: {nameFitting.fittedWidthMm.toFixed(1)} mm)
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Placeholder Rules Inspector */}
              <div className="border-t border-slate-800 pt-4 space-y-3">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Ruler className="w-4 h-4 text-emerald-400" />
                  Reglas Paramétricas de Impresión para este Diseño
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                    <div className="text-white font-bold flex justify-between">
                      <span>{"{{NOMBRE}}"}</span>
                      <span className="text-emerald-400">Espalda Superior</span>
                    </div>
                    <div className="text-slate-400 text-[11px] flex justify-between">
                      <span>Ancho Máximo:</span>
                      <span className="text-slate-200">{nameRule?.maxWidthMm} mm</span>
                    </div>
                    <div className="text-slate-400 text-[11px] flex justify-between">
                      <span>Alto Nominal:</span>
                      <span className="text-slate-200">{nameRule?.defaultFontSizeMm} mm</span>
                    </div>
                    <div className="text-slate-400 text-[11px] flex justify-between">
                      <span>Compresión Mínima:</span>
                      <span className="text-slate-200">{((nameRule?.minScaleFactor || 0.6) * 100)}%</span>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                    <div className="text-white font-bold flex justify-between">
                      <span>{"{{NUMERO}}"}</span>
                      <span className="text-emerald-400">Espalda Central</span>
                    </div>
                    <div className="text-slate-400 text-[11px] flex justify-between">
                      <span>Ancho Máximo:</span>
                      <span className="text-slate-200">{numberRule?.maxWidthMm} mm</span>
                    </div>
                    <div className="text-slate-400 text-[11px] flex justify-between">
                      <span>Alto Nominal:</span>
                      <span className="text-slate-200">{numberRule?.defaultFontSizeMm} mm</span>
                    </div>
                    <div className="text-slate-400 text-[11px] flex justify-between">
                      <span>Contorno Exterior:</span>
                      <span className="text-slate-200">{numberRule?.strokeWidthMm} mm</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
