import { Point2D, Polygon2D, BoundingBox } from './types';
import { computeBoundingBox, doBoundingBoxesOverlap } from './transform';

// Factor de escala para pasar de milímetros float a enteros de alta precisión en Clipper2
// 1 mm = 1000 unidades (resolución de 1 micrón / 0.001 mm)
const SCALE_FACTOR = 1000;
const BIG_SCALE = 1000n;

let clipperInstance: any = null;
let initPromise: Promise<any> | null = null;

/**
 * Inicializa y devuelve la instancia singleton del motor Clipper2 WebAssembly
 */
export async function getClipperInstance(): Promise<any> {
  if (clipperInstance) return clipperInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const clipperModule = await import('clipper2-wasm');
      const factory = clipperModule.default || clipperModule;
      
      const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';
      
      let wasmPath = '';
      if (!isBrowser) {
        try {
          const { createRequire } = await import('node:module');
          const require = createRequire(import.meta.url);
          wasmPath = require.resolve('clipper2-wasm/dist/es/clipper2z.wasm');
        } catch {
          // Fallback a ruta relativa estándar en Node
          wasmPath = 'node_modules/clipper2-wasm/dist/es/clipper2z.wasm';
        }
      }

      clipperInstance = await factory({
        locateFile: (file: string) => {
          if (isBrowser) {
            return `/${file}`;
          }
          return wasmPath || file;
        }
      });
      return clipperInstance;
    } catch (err) {
      console.error('[ClipperService] Error inicializando Clipper2 WASM:', err);
      throw err;
    }
  })();

  return initPromise;
}

/**
 * Convierte un Polygon2D (coordenadas en mm) en un Path64 de Clipper2
 */
export function polygonToPath64(clip: any, polygon: Polygon2D): any {
  const path = new clip.Path64();
  for (let i = 0; i < polygon.length; i++) {
    const p = polygon[i];
    const x = BigInt(Math.round(p.x * SCALE_FACTOR));
    const y = BigInt(Math.round(p.y * SCALE_FACTOR));
    const pt = new clip.Point64(x, y, 0n);
    path.push_back(pt);
    pt.delete();
  }
  return path;
}

/**
 * Convierte un Path64 de Clipper2 en un Polygon2D con coordenadas en mm
 */
export function path64ToPolygon(path64: any): Polygon2D {
  const size = path64.size();
  const polygon: Polygon2D = [];
  for (let i = 0; i < size; i++) {
    const pt = path64.get(i);
    polygon.push({
      x: Number(pt.x) / SCALE_FACTOR,
      y: Number(pt.y) / SCALE_FACTOR,
    });
    pt.delete();
  }
  return polygon;
}

/**
 * Infla (aplica offset exterior positivo) o desinfla un polígono en mm
 * Utilizado para crear el margen de seguridad de 7.0 mm alrededor de cada pieza de corte.
 */
export async function inflatePolygon(
  polygon: Polygon2D,
  deltaMm: number,
  joinType: 'Square' | 'Round' | 'Miter' = 'Square'
): Promise<Polygon2D[]> {
  if (!polygon || polygon.length < 3 || Math.abs(deltaMm) < 0.001) {
    return [polygon];
  }

  const clip = await getClipperInstance();
  const path = polygonToPath64(clip, polygon);
  const paths = new clip.Paths64();
  paths.push_back(path);

  const deltaUnits = deltaMm * SCALE_FACTOR;
  const jt = clip.JoinType[joinType] || clip.JoinType.Square;
  const et = clip.EndType.Polygon;

  const resultPaths = clip.InflatePaths64(paths, deltaUnits, jt, et, 2.0, 0.0);

  const results: Polygon2D[] = [];
  const numPaths = resultPaths.size();
  for (let i = 0; i < numPaths; i++) {
    const resP = resultPaths.get(i);
    results.push(path64ToPolygon(resP));
    resP.delete();
  }

  // Liberar memoria C++
  path.delete();
  paths.delete();
  resultPaths.delete();

  return results;
}

/**
 * Verifica si dos polígonos irregulares se intersectan físicamente.
 * Aplica primero una poda rápida por AABB (Bounding Box) en O(1),
 * y solo si los AABB se superponen, invoca la intersección poligonal booleana de Clipper2.
 */
export async function checkPolygonsOverlap(
  polyA: Polygon2D,
  polyB: Polygon2D,
  bboxA?: BoundingBox,
  bboxB?: BoundingBox
): Promise<boolean> {
  const boxA = bboxA || computeBoundingBox(polyA);
  const boxB = bboxB || computeBoundingBox(polyB);

  // Poda rápida AABB
  if (!doBoundingBoxesOverlap(boxA, boxB, 0)) {
    return false;
  }

  const clip = await getClipperInstance();
  const pathA = polygonToPath64(clip, polyA);
  const pathB = polygonToPath64(clip, polyB);

  const pathsA = new clip.Paths64();
  pathsA.push_back(pathA);

  const pathsB = new clip.Paths64();
  pathsB.push_back(pathB);

  const intersection = clip.Intersect64(pathsA, pathsB, clip.FillRule.NonZero);
  const hasOverlap = intersection.size() > 0;

  let positiveArea = false;
  if (hasOverlap) {
    const areaUnits2 = clip.AreaPaths64(intersection);
    // Filtrar pequeñas degeneraciones numéricas menores a 0.001 mm²
    const areaMm2 = Math.abs(areaUnits2) / (SCALE_FACTOR * SCALE_FACTOR);
    positiveArea = areaMm2 > 0.001;
  }

  // Limpieza C++
  pathA.delete();
  pathB.delete();
  pathsA.delete();
  pathsB.delete();
  intersection.delete();

  return positiveArea;
}

/**
 * Calcula el área exacta de intersección entre dos polígonos en mm²
 */
export async function calculatePolygonalIntersectionArea(
  polyA: Polygon2D,
  polyB: Polygon2D
): Promise<number> {
  const boxA = computeBoundingBox(polyA);
  const boxB = computeBoundingBox(polyB);

  if (!doBoundingBoxesOverlap(boxA, boxB, 0)) {
    return 0;
  }

  const clip = await getClipperInstance();
  const pathA = polygonToPath64(clip, polyA);
  const pathB = polygonToPath64(clip, polyB);

  const pathsA = new clip.Paths64();
  pathsA.push_back(pathA);

  const pathsB = new clip.Paths64();
  pathsB.push_back(pathB);

  const intersection = clip.Intersect64(pathsA, pathsB, clip.FillRule.NonZero);
  const areaUnits2 = clip.AreaPaths64(intersection);
  const areaMm2 = Math.abs(areaUnits2) / (SCALE_FACTOR * SCALE_FACTOR);

  pathA.delete();
  pathB.delete();
  pathsA.delete();
  pathsB.delete();
  intersection.delete();

  return Number(areaMm2.toFixed(4));
}
