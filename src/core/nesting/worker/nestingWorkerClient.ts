import { NestingPieceInput, NestingOptions, NestingResult } from '../types';
import { runPolygonalNesting } from '../polygonal/polygonalNestingEngine';

/**
 * Cliente para ejecutar el motor de nesting poligonal desacoplado de la UI.
 * Si se encuentra en un entorno de navegador/Electron con soporte de Worker,
 * delega la tarea a un Worker Thread para mantener los 60 FPS de la interfaz.
 * Si no está disponible (ej: Vitest en Node puro), ejecuta de forma asíncrona directa.
 */
export async function executePolygonalNestingWithWorker(
  pieces: NestingPieceInput[],
  options: NestingOptions,
  onProgress?: (progress: number) => void
): Promise<NestingResult> {
  // Comprobación de disponibilidad de Worker
  const hasWorker = typeof window !== 'undefined' && typeof window.Worker !== 'undefined';

  if (!hasWorker) {
    // Modo directo asíncrono
    return runPolygonalNesting(pieces, options, onProgress);
  }

  return new Promise<NestingResult>((resolve, reject) => {
    try {
      const worker = new Worker(
        new URL('../../../workers/nestingWorker.ts', import.meta.url),
        { type: 'module' }
      );

      worker.onmessage = (event) => {
        const { type, progress, result, error } = event.data;

        if (type === 'PROGRESS' && onProgress && progress !== undefined) {
          onProgress(progress);
        } else if (type === 'COMPLETE') {
          worker.terminate();
          resolve(result);
        } else if (type === 'ERROR') {
          worker.terminate();
          reject(new Error(error || 'Error desconocido en Worker de Nesting'));
        }
      };

      worker.onerror = (err) => {
        worker.terminate();
        // Fallback a ejecución directa si el worker falla
        console.warn('[NestingWorkerClient] Error en Worker, ejecutando en hilo principal:', err);
        runPolygonalNesting(pieces, options, onProgress).then(resolve).catch(reject);
      };

      worker.postMessage({
        type: 'RUN_POLYGONAL_NESTING',
        payload: { pieces, options },
      });
    } catch (err) {
      console.warn('[NestingWorkerClient] No se pudo instanciar Worker, usando ejecución directa:', err);
      runPolygonalNesting(pieces, options, onProgress).then(resolve).catch(reject);
    }
  });
}
