import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Zap,
  CheckCircle2,
  RotateCcw,
  Ruler,
  ShieldCheck,
  TrendingUp,
  Layers,
  ArrowRight,
  Sliders,
} from 'lucide-react';

export interface HeroInteractiveNestingProps {
  className?: string;
  initialOptimized?: boolean;
}

export const HeroInteractiveNesting: React.FC<HeroInteractiveNestingProps> = ({
  className = '',
  initialOptimized = true,
}) => {
  const [isOptimized, setIsOptimized] = useState(initialOptimized);
  const [isCalculating, setIsCalculating] = useState(false);
  const [displayedEfficiency, setDisplayedEfficiency] = useState(
    initialOptimized ? 92.4 : 68.2
  );
  const [activePiece, setActivePiece] = useState<string | null>(null);

  // Smooth efficiency counter animation when toggling state
  useEffect(() => {
    const target = isOptimized ? 92.4 : 68.2;
    const start = displayedEfficiency;
    const duration = 600;
    const startTime = performance.now();

    const animateNumber = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentVal = start + (target - start) * easeProgress;
      setDisplayedEfficiency(Number(currentVal.toFixed(1)));

      if (progress < 1) {
        requestAnimationFrame(animateNumber);
      }
    };

    requestAnimationFrame(animateNumber);
  }, [isOptimized]);

  const handleToggle = () => {
    setIsCalculating(true);
    setTimeout(() => {
      setIsOptimized((prev) => !prev);
      setIsCalculating(false);
    }, 280);
  };

  return (
    <div
      className={`relative w-full max-w-xl mx-auto select-none transition-all duration-300 ${className}`}
      data-testid="hero-interactive-nesting"
    >
      {/* Glow aura background effect */}
      <div
        className={`absolute -inset-1.5 rounded-3xl opacity-40 blur-xl transition-all duration-700 pointer-events-none ${
          isOptimized
            ? 'bg-gradient-to-r from-violet-600/40 via-indigo-500/30 to-emerald-500/40'
            : 'bg-gradient-to-r from-amber-500/30 via-rose-500/30 to-purple-500/30'
        }`}
      />

      {/* Main Glassmorphic SaaS Window Card */}
      <div className="relative rounded-2xl bg-white/95 dark:bg-neutral-900/90 backdrop-blur-xl border border-neutral-200/90 dark:border-neutral-800 shadow-2xl overflow-hidden transition-all duration-300">
        {/* Window Titlebar */}
        <div className="flex items-center justify-between px-3.5 sm:px-4 py-2.5 sm:py-3 bg-neutral-50/90 dark:bg-neutral-950/60 border-b border-neutral-200/80 dark:border-neutral-800 text-xs">
          {/* Traffic Lights */}
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 sm:size-3 rounded-full bg-[#FF5F57] inline-block shadow-xs" />
            <span className="size-2.5 sm:size-3 rounded-full bg-[#FEBC2E] inline-block shadow-xs" />
            <span className="size-2.5 sm:size-3 rounded-full bg-[#28C840] inline-block shadow-xs" />
            <span className="ml-2 font-mono text-[11px] sm:text-xs font-semibold text-neutral-600 dark:text-neutral-400 truncate max-w-[170px] sm:max-w-none">
              bobina_1600mm_produccion.cim
            </span>
          </div>

          {/* Engine Status Pill */}
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="hidden sm:inline font-mono text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
              Motor 1:1 Activo
            </span>
            <span className="sm:hidden font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
              1:1
            </span>
          </div>
        </div>

        {/* Nesting Control & Metrics Bar */}
        <div className="px-2.5 sm:px-4 py-2 sm:py-2.5 bg-neutral-100/60 dark:bg-neutral-950/40 border-b border-neutral-200/70 dark:border-neutral-800 flex items-center justify-between gap-1.5 text-xs">
          {/* Segmented Mode Selector / Action Button */}
          <div className="flex items-center gap-0.5 sm:gap-1 bg-neutral-200/70 dark:bg-neutral-800 p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => {
                if (isOptimized) handleToggle();
              }}
              className={`px-2 sm:px-2.5 py-1 rounded-md text-[10px] sm:text-[11px] font-medium transition-all cursor-pointer touch-manipulation ${
                !isOptimized
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              Manual (68.2%)
            </button>
            <button
              type="button"
              onClick={() => {
                if (!isOptimized) handleToggle();
              }}
              className={`px-2 sm:px-2.5 py-1 rounded-md text-[10px] sm:text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer touch-manipulation ${
                isOptimized
                  ? 'bg-violet-600 text-white shadow-xs font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              <Sparkles className="size-2.5 sm:size-3" />
              <span>CimaTex (92.4%)</span>
            </button>
          </div>

          {/* Quick Toggle / Optimize Action */}
          <button
            type="button"
            onClick={handleToggle}
            disabled={isCalculating}
            className={`inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-semibold transition-all cursor-pointer touch-manipulation ${
              isOptimized
                ? 'bg-neutral-200/80 hover:bg-neutral-300/80 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200'
                : 'bg-violet-600 hover:bg-violet-700 text-white shadow-sm shadow-violet-500/20 active:scale-95'
            }`}
          >
            {isCalculating ? (
              <>
                <RotateCcw className="size-3 animate-spin text-current" />
                <span>Calculando...</span>
              </>
            ) : isOptimized ? (
              <>
                <RotateCcw className="size-3" />
                <span className="hidden sm:inline">Ver Manual</span>
                <span className="sm:hidden">Manual</span>
              </>
            ) : (
              <>
                <Zap className="size-3 fill-current" />
                <span>Optimizar Bobina</span>
              </>
            )}
          </button>
        </div>

        {/* Sublimation Roll Graphic Canvas (1600 mm simulation) */}
        <div className="relative p-3 sm:p-4 bg-gradient-to-b from-neutral-50 to-neutral-100/70 dark:from-neutral-900 dark:to-neutral-950 overflow-hidden">
          {/* Roll Ruler Header (1600 mm) */}
          <div className="mb-2 flex items-center justify-between text-[10px] font-mono text-neutral-500 dark:text-neutral-400 px-1 border-b border-dashed border-neutral-300 dark:border-neutral-700 pb-1">
            <div className="flex items-center gap-1">
              <Ruler className="size-3 text-violet-500" />
              <span>0 mm</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-neutral-400">··· Ancho de Impresión Sublimación ···</span>
              <span className="font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/70 px-1.5 py-0.5 rounded border border-violet-200 dark:border-violet-800">
                1600 mm
              </span>
            </div>
          </div>

          {/* Continuous Roll Paper Simulation Frame */}
          <div className="relative w-full h-[230px] sm:h-[260px] rounded-xl bg-white dark:bg-neutral-950 border-2 border-neutral-300/80 dark:border-neutral-700/80 shadow-inner overflow-hidden">
            {/* Textile Grid Pattern & Margin Guides */}
            <div
              className="absolute inset-0 opacity-25 dark:opacity-15 bg-[radial-gradient(#6366f1_1px,transparent_1px)] bg-[size:16px_16px]"
              aria-hidden="true"
            />

            {/* Sublimation Roll Edge guides (Margen 10mm plóter) */}
            <div className="absolute top-0 bottom-0 left-2 w-px border-r border-dashed border-neutral-300 dark:border-neutral-700 pointer-events-none" />
            <div className="absolute top-0 bottom-0 right-2 w-px border-l border-dashed border-neutral-300 dark:border-neutral-700 pointer-events-none" />

            {/* Waste Warning Area in Manual Mode */}
            {!isOptimized && (
              <div className="absolute right-3 top-8 bottom-8 w-[38%] rounded-xl border-2 border-dashed border-rose-300/80 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 flex flex-col items-center justify-center p-2 text-center transition-opacity duration-500 pointer-events-none">
                <span className="font-mono text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                  Área sin aprovechar
                </span>
                <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 mt-0.5">
                  +1.4 m² merma de tela
                </span>
                <span className="text-[9px] text-rose-500/90 dark:text-rose-400/80 mt-1">
                  Espacio muerto en rollo
                </span>
              </div>
            )}

            {/* SVG Nesting Canvas with Stylized Sports Apparel Pieces */}
            <svg
              viewBox="0 0 520 250"
              className="w-full h-full"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                {/* Delantero Gradient */}
                <linearGradient id="jerseyFrontGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4f46e5" />
                  <stop offset="50%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#818cf8" />
                </linearGradient>

                {/* Espalda Gradient */}
                <linearGradient id="jerseyBackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3730a3" />
                  <stop offset="50%" stopColor="#4338ca" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>

                {/* Mangas Gradient */}
                <linearGradient id="sleeveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0284c7" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>

                {/* Cuello Gradient */}
                <linearGradient id="collarGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#fbbf24" />
                </linearGradient>

                {/* Filter for soft piece drop shadow */}
                <filter id="pieceShadow" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.15" />
                </filter>
              </defs>

              {/* ── PIECE 1: DELANTERO (Front Jersey Pattern) ── */}
              <g
                transform={
                  isOptimized
                    ? 'translate(14, 12) rotate(0) scale(0.88)'
                    : 'translate(16, 12) rotate(0) scale(0.88)'
                }
                className="transition-all duration-700 ease-out cursor-pointer"
                onMouseEnter={() => setActivePiece('DELANTERO')}
                onMouseLeave={() => setActivePiece(null)}
                filter="url(#pieceShadow)"
              >
                {/* Outline Seam Allowance (Margen de costura) */}
                <path
                  d="M 28,18 C 50,38 90,38 112,18 L 138,28 L 148,60 C 132,95 132,125 144,155 L 138,235 C 90,242 50,242 2,235 L -4,155 C 8,125 8,95 -8,60 L 2,28 Z"
                  fill="url(#jerseyFrontGrad)"
                  stroke="#312e81"
                  strokeWidth="1.5"
                />
                {/* Seam allowance dotted guide */}
                <path
                  d="M 32,24 C 52,41 88,41 108,24 L 132,32 L 140,62 C 126,94 126,122 136,150 L 132,228 C 88,234 52,234 8,228 L 4,150 C 14,122 14,94 0,62 L 8,32 Z"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="0.8"
                  strokeDasharray="3 2"
                  opacity="0.6"
                />
                {/* Sport Kit Graphical Stripes */}
                <path
                  d="M 50,55 L 90,55 L 105,230 L 35,230 Z"
                  fill="#ffffff"
                  opacity="0.18"
                />
                {/* Chest Logo & Label */}
                <circle cx="70" cy="90" r="10" fill="#ffffff" opacity="0.3" />
                <text
                  x="70"
                  y="93"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="7"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  CIMA
                </text>
                <text
                  x="70"
                  y="125"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="18"
                  fontWeight="900"
                  fontFamily="sans-serif"
                >
                  10
                </text>
                <text
                  x="70"
                  y="145"
                  textAnchor="middle"
                  fill="#e0e7ff"
                  fontSize="8"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                  letterSpacing="1"
                >
                  DELANTERO L
                </text>
                <text
                  x="70"
                  y="160"
                  textAnchor="middle"
                  fill="#c7d2fe"
                  fontSize="6.5"
                  fontFamily="monospace"
                >
                  #1042 · SUBLIMACIÓN
                </text>
              </g>

              {/* ── PIECE 2: ESPALDA (Back Jersey Pattern) ── */}
              <g
                transform={
                  isOptimized
                    ? 'translate(285, 236) rotate(180) scale(0.88)'
                    : 'translate(148, 12) rotate(0) scale(0.88)'
                }
                className="transition-all duration-700 ease-out cursor-pointer"
                onMouseEnter={() => setActivePiece('ESPALDA')}
                onMouseLeave={() => setActivePiece(null)}
                filter="url(#pieceShadow)"
              >
                <path
                  d="M 30,10 C 50,22 90,22 110,10 L 138,22 L 148,58 C 132,95 132,125 144,155 L 138,235 C 90,242 50,242 2,235 L -4,155 C 8,125 8,95 -8,58 L 2,22 Z"
                  fill="url(#jerseyBackGrad)"
                  stroke="#1e1b4b"
                  strokeWidth="1.5"
                />
                {/* Seam guide */}
                <path
                  d="M 34,16 C 52,26 88,26 106,16 L 132,26 L 140,60 C 126,94 126,122 136,150 L 132,228 C 88,234 52,234 8,228 L 4,150 C 14,122 14,94 0,60 L 8,26 Z"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="0.8"
                  strokeDasharray="3 2"
                  opacity="0.6"
                />
                {/* Back Player Name & Big Dorsal */}
                <text
                  x="70"
                  y="85"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="10"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                  letterSpacing="1.5"
                >
                  CIMATEX
                </text>
                <text
                  x="70"
                  y="140"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="36"
                  fontWeight="900"
                  fontFamily="sans-serif"
                >
                  10
                </text>
                <text
                  x="70"
                  y="165"
                  textAnchor="middle"
                  fill="#c7d2fe"
                  fontSize="8"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                  letterSpacing="1"
                >
                  ESPALDA L
                </text>
              </g>

              {/* ── PIECE 3: MANGA IZQUIERDA (Left Sleeve Pattern) ── */}
              <g
                transform={
                  isOptimized
                    ? 'translate(290, 8) rotate(0) scale(0.85)'
                    : 'translate(285, 14) rotate(0) scale(0.85)'
                }
                className="transition-all duration-700 ease-out cursor-pointer"
                onMouseEnter={() => setActivePiece('MANGA_IZQ')}
                onMouseLeave={() => setActivePiece(null)}
                filter="url(#pieceShadow)"
              >
                <path
                  d="M 8,80 C 12,30 80,0 100,0 C 120,0 188,30 192,80 L 165,130 C 125,124 75,124 35,130 Z"
                  fill="url(#sleeveGrad)"
                  stroke="#0369a1"
                  strokeWidth="1.5"
                />
                <path
                  d="M 16,80 C 22,38 78,12 100,12 C 122,12 178,38 184,80 L 158,122 C 124,117 76,117 42,122 Z"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="0.8"
                  strokeDasharray="3 2"
                  opacity="0.6"
                />
                <text
                  x="100"
                  y="65"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="9"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  MANGA IZQ · L
                </text>
                {/* Sleeve Sponsor Band */}
                <rect x="50" y="85" width="100" height="14" rx="3" fill="#ffffff" opacity="0.25" />
                <text
                  x="100"
                  y="95"
                  textAnchor="middle"
                  fill="#0c4a6e"
                  fontSize="6.5"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  SPONSOR OFICIAL
                </text>
              </g>

              {/* ── PIECE 4: MANGA DERECHA (Right Sleeve Pattern) ── */}
              <g
                transform={
                  isOptimized
                    ? 'translate(458, 238) rotate(180) scale(0.85)'
                    : 'translate(285, 125) rotate(0) scale(0.85)'
                }
                className="transition-all duration-700 ease-out cursor-pointer"
                onMouseEnter={() => setActivePiece('MANGA_DER')}
                onMouseLeave={() => setActivePiece(null)}
                filter="url(#pieceShadow)"
              >
                <path
                  d="M 8,80 C 12,30 80,0 100,0 C 120,0 188,30 192,80 L 165,130 C 125,124 75,124 35,130 Z"
                  fill="url(#sleeveGrad)"
                  stroke="#0369a1"
                  strokeWidth="1.5"
                />
                <path
                  d="M 16,80 C 22,38 78,12 100,12 C 122,12 178,38 184,80 L 158,122 C 124,117 76,117 42,122 Z"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="0.8"
                  strokeDasharray="3 2"
                  opacity="0.6"
                />
                <text
                  x="100"
                  y="65"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="9"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  MANGA DER · L
                </text>
                <rect x="50" y="85" width="100" height="14" rx="3" fill="#ffffff" opacity="0.25" />
                <text
                  x="100"
                  y="95"
                  textAnchor="middle"
                  fill="#0c4a6e"
                  fontSize="6.5"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  LIGA NACIONAL
                </text>
              </g>

              {/* ── PIECE 5: CUELLO Y RIBETE (Collar Band) ── */}
              <g
                transform={
                  isOptimized
                    ? 'translate(295, 120) scale(0.85)'
                    : 'translate(148, 222) scale(0.85)'
                }
                className="transition-all duration-700 ease-out cursor-pointer"
                onMouseEnter={() => setActivePiece('CUELLO')}
                onMouseLeave={() => setActivePiece(null)}
                filter="url(#pieceShadow)"
              >
                <rect
                  x="0"
                  y="0"
                  width="180"
                  height="22"
                  rx="4"
                  fill="url(#collarGrad)"
                  stroke="#b45309"
                  strokeWidth="1.2"
                />
                <text
                  x="90"
                  y="14"
                  textAnchor="middle"
                  fill="#78350f"
                  fontSize="7.5"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                  letterSpacing="1"
                >
                  CUELLO RIBETE V · 44 cm
                </text>
              </g>

              {/* ── OPTIMIZED 1:1 INTERLOCKING TOLERANCE LINES ── */}
              {isOptimized && (
                <g className="transition-opacity duration-700 opacity-90 pointer-events-none">
                  {/* Clearance dimension callout */}
                  <line
                    x1="140"
                    y1="110"
                    x2="155"
                    y2="110"
                    stroke="#10b981"
                    strokeWidth="1.5"
                  />
                  <circle cx="140" cy="110" r="2" fill="#10b981" />
                  <circle cx="155" cy="110" r="2" fill="#10b981" />
                  <text
                    x="148"
                    y="105"
                    textAnchor="middle"
                    fill="#059669"
                    fontSize="6"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    3mm
                  </text>
                </g>
              )}
            </svg>

            {/* Hover Tooltip Overlay */}
            {activePiece && (
              <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md bg-neutral-900/90 text-white text-[10px] font-mono shadow-md backdrop-blur-sm pointer-events-none flex items-center gap-1.5 animate-in fade-in duration-150">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                <span>Pieza: {activePiece} · Tolerancia: 3 mm</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Metrics & Savings Showcase */}
        <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-neutral-50/90 dark:bg-neutral-950/80 border-t border-neutral-200/80 dark:border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          {/* Efficiency Bar with Animated Counter */}
          <div className="w-full sm:w-auto flex-1 max-w-xs">
            <div className="flex items-center justify-between text-xs mb-1 font-semibold">
              <span className="text-neutral-600 dark:text-neutral-300 flex items-center gap-1">
                <TrendingUp className="size-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
                <span className="text-[11px] sm:text-xs">
                  {isOptimized
                    ? '92.4% (Optimizado con CimaTex)'
                    : 'Eficiencia: 68.2% (Manual)'}
                </span>
              </span>
              <span
                className={`font-mono font-bold text-xs ${
                  isOptimized
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {displayedEfficiency}%
              </span>
            </div>

            {/* Progress Track */}
            <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  isOptimized
                    ? 'bg-gradient-to-r from-violet-600 via-indigo-500 to-emerald-500'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${displayedEfficiency}%` }}
              />
            </div>
          </div>

          {/* Savings Badge */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            {isOptimized ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold shadow-xs animate-in zoom-in-95 duration-200">
                <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Ahorro: +1.4m de tela</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-bold shadow-xs animate-in zoom-in-95 duration-200">
                <span>Merma alta: -31.8%</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating 3D Mascot & Millimetric Validation Badge */}
      <div className="absolute -bottom-5 right-0 sm:-right-4 z-20 flex items-center gap-2 group cursor-default">
        {/* Validation Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/95 dark:bg-neutral-900/95 border border-violet-200 dark:border-violet-800/80 shadow-lg text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 backdrop-blur-md transform transition-all group-hover:scale-105">
          <ShieldCheck className="size-3.5 text-violet-600 shrink-0" />
          <span>Validación milimétrica 1:1 activa</span>
        </div>

        {/* 3D Mascot Avatar */}
        <div className="relative size-12 sm:size-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 p-0.5 shadow-xl transition-transform hover:scale-110 active:scale-95 animate-bounce [animation-duration:3s]">
          <img
            src="/cimatex-mascota.webp"
            alt="Mascota CimaTex 3D"
            className="w-full h-full object-contain drop-shadow-md rounded-[14px]"
            loading="lazy"
          />
          {/* Subtle online check badge */}
          <span className="absolute -top-1 -right-1 size-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-neutral-900 flex items-center justify-center text-[7px] text-white font-bold">
            ✓
          </span>
        </div>
      </div>
    </div>
  );
};
