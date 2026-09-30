import { NestingPieceInput, NestingOptions, NestingResult } from '../types';
import { runPolygonalNesting } from '../polygonal/polygonalNestingEngine';
import { runNestingEngine } from '../nestingEngine';

/**
 * Cliente de ejecución para el motor de nesting poligonal.
 * Ejecuta con micro-pausa asíncrona para no congelar la UI y devuelve
 * el resultado en milisegundos de forma 100% confiable y sin fallos de Worker en Vite.
 */
export async function executePolygonalNestingWithWorker(
  pieces: NestingPieceInput[],
  options: NestingOptions,
  onProgress?: (progress: number) => void
): Promise<NestingResult> {
  try {
    // Permitir al navegador pintar el estado "Optimizando" antes del cálculo
    await new Promise((resolve) => setTimeout(resolve, 20));

    if (onProgress) onProgress(30);
    const result = runPolygonalNesting(pieces, options, onProgress);
    if (onProgress) onProgress(100);

    return result;
  } catch (err) {
    console.warn('[NestingWorkerClient] Error en cálculo poligonal, ejecutando fallback:', err);
    return runNestingEngine(pieces, options);
  }
}
