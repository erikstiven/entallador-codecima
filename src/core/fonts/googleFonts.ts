/**
 * Integración y cargador de fuentes (Google Fonts, Fuentes del Sistema Windows/Mac y Archivos TTF/OTF)
 */

export interface SportsFontOption {
  family: string;
  category: string;
  sampleText: string;
  isLocal?: boolean;
}

export const POPULAR_SPORTS_FONTS: SportsFontOption[] = [
  // Fuentes Deportivas Instaladas Habituales (Mundiales y Ligas)
  { family: 'AdiCup Q 2022', category: 'Adidas Qatar 2022', sampleText: '10 MESSI', isLocal: true },
  { family: 'Jersey M54', category: 'Dorsal Clásico Bloque', sampleText: '9 RONALDO', isLocal: true },
  { family: 'Ecuador Qatar 2022', category: 'Ecuador Oficial', sampleText: '13 ENNER', isLocal: true },
  { family: 'Argentina 2024 Tipografstore', category: 'Argentina Copa América', sampleText: '10 MESSI', isLocal: true },
  { family: 'Premier League 23-24 Tipografst', category: 'Premier League', sampleText: '9 HAALAND', isLocal: true },
  { family: 'Adidas World Cup22 by Zaugrafic', category: 'Mundial 2022', sampleText: '7 MBAPPÉ', isLocal: true },
  
  // Fuentes Web / Google Fonts
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
 * Consulta las fuentes instaladas localmente en Windows/Mac mediante la Local Font Access API
 */
export async function getLocalSystemFonts(): Promise<string[]> {
  if (typeof window !== 'undefined' && 'queryLocalFonts' in window) {
    try {
      const fonts = await (window as any).queryLocalFonts();
      const families = Array.from(new Set(fonts.map((f: any) => f.family))).filter(Boolean) as string[];
      return families.sort((a, b) => a.localeCompare(b));
    } catch (err) {
      console.warn('Acceso a fuentes locales denegado o no disponible:', err);
    }
  }
  return [];
}

/**
 * Carga un archivo de fuente local (.ttf, .otf, .woff) directamente en el navegador con FontFace
 */
export async function loadCustomFontFromFile(file: File): Promise<string> {
  const fontName = file.name.replace(/\.[^/.]+$/, '').trim();
  const buffer = await file.arrayBuffer();
  const fontFace = new FontFace(fontName, buffer);
  await fontFace.load();
  document.fonts.add(fontFace);
  loadedFonts.add(`local-${fontName.toLowerCase()}`);
  return fontName;
}

/**
 * Carga una tipografía de Google Fonts en el DOM dinámicamente si no ha sido cargada antes
 */
export function loadGoogleFont(fontFamily: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const cleanName = fontFamily.trim();
  if (!cleanName) return;

  // Si ya está en las fuentes del documento o es fuente de sistema típica, no solicitar a Google
  const fontId = `gfont-${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  if (loadedFonts.has(fontId) || document.getElementById(fontId)) {
    return;
  }

  try {
    const link = document.createElement('link');
    link.id = fontId;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(cleanName)}:wght@400;700;900&display=swap`;
    document.head.appendChild(link);
    loadedFonts.add(fontId);
  } catch (err) {
    console.warn(`No se pudo cargar la fuente "${cleanName}":`, err);
  }
}
