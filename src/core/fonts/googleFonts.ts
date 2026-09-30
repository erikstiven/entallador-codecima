/**
 * Integración y cargador dinámico de Google Fonts para uniformes deportivos
 */

export interface SportsFontOption {
  family: string;
  category: string;
  sampleText: string;
}

export const POPULAR_SPORTS_FONTS: SportsFontOption[] = [
  { family: 'Bebas Neue', category: 'Condensada Deportiva', sampleText: '10 CHRISTOPHER' },
  { family: 'Teko', category: 'Ultra Alta y Estrecha', sampleText: '9 MESSI' },
  { family: 'Anton', category: 'Bloque Grueso / Impacto', sampleText: '7 RONALDO' },
  { family: 'Oswald', category: 'Clásica Uniforme', sampleText: '23 JORDAN' },
  { family: 'Barlow Condensed', category: 'Moderna / Racing', sampleText: '11 NEYMAR' },
  { family: 'Montserrat', category: 'Geométrica / Limpia', sampleText: '5 ZIDANE' },
  { family: 'Chakra Petch', category: 'Futurista / Esquinas', sampleText: '8 INIESTA' },
  { family: 'Russo One', category: 'Bordes Robustos', sampleText: '99 HAALAND' },
  { family: 'Kanit', category: 'Atlética / Pesada', sampleText: '4 VAN DIJK' },
  { family: 'Black Han Sans', category: 'Ultra Pesada', sampleText: '21 MBAPPÉ' },
  { family: 'Squada One', category: 'Dorsal Cuadrado', sampleText: '1 CASILLAS' },
  { family: 'Fjalla One', category: 'Densa / Escandinava', sampleText: '14 MODRIC' },
  { family: 'Righteous', category: 'Líneas Redondeadas', sampleText: '20 VINICIUS' },
  { family: 'Saira Condensed', category: 'Compresión Extrema', sampleText: '17 DE BRUYNE' },
  { family: 'Staatliches', category: 'Cartel Retro', sampleText: '88 KROOS' },
  { family: 'Audiowide', category: 'Digital / eSports', sampleText: '00 CYBER' },
];

const loadedFonts = new Set<string>();

/**
 * Carga una tipografía de Google Fonts en el DOM dinámicamente si no ha sido cargada antes
 */
export function loadGoogleFont(fontFamily: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const cleanName = fontFamily.trim();
  if (!cleanName) return;

  const fontId = `gfont-${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  if (loadedFonts.has(fontId) || document.getElementById(fontId)) {
    return;
  }

  try {
    const link = document.createElement('link');
    link.id = fontId;
    link.rel = 'stylesheet';
    // Se solicitan pesos normales y pesados (400, 700, 900)
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(cleanName)}:wght@400;700;900&display=swap`;
    document.head.appendChild(link);
    loadedFonts.add(fontId);
  } catch (err) {
    console.warn(`No se pudo cargar la fuente de Google Fonts "${cleanName}":`, err);
  }
}
