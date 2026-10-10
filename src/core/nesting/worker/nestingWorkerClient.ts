import { NestingPieceInput, NestingOptions, NestingResult } from '../types';
import { runPolygonalNesting } from '../polygonal/polygonalNestingEngine';
import { performModularNesting } from '../modularNestingEngine';
import { runNestingEngine } from '../nestingEngine';
import type {
  NestingWorkerAlgorithm,
  NestingWorkerMessage,
  NestingWorkerResponse,
} from '../../../workers/nestingWorker';

const activeWorkers = new Set<Worker>();

/**
 * Reconcilia referencias entre result.placedPieces y result.sheets[].placedPieces
 * tras la deserialización (Structured Clone) del Web Worker para evitar duplicar objetos en RAM.
 */
function deduplicateResultReferences(result: NestingResult): NestingResult {
  if (!result.sheets) {
    result.sheets = [];
    return result;
  }
  const pieceMap = new Map(result.placedPieces.map((p) => [p.id, p]));
  for (const sheet of result.sheets) {
    sheet.placedPieces = sheet.placedPieces.map((p) => pieceMap.get(p.id) ?? p);
  }
  return result;
}

/**
 * Ejecución directa en el proceso actual (fallback para entornos Node/Vitest
 * o si el Web Worker no puede inicializarse).
 */
async function executeDirectNesting(
  pieces: NestingPieceInput[],
  options: NestingOptions,
  algorithm: NestingWorkerAlgorithm = 'MODULAR_INDUSTRIAL',
  onProgress?: (progress: number) => void
): Promise<NestingResult> {
  if (onProgress) onProgress(20);

  let result: NestingResult;

  if (algorithm === 'POLYGONAL_CLIPPER2') {
    try {
      result = await runPolygonalNesting(pieces, options, onProgress);
    } catch (err) {
      console.warn('[NestingWorkerClient] Error en cálculo poligonal, ejecutando fallback:', err);
      try {
        result = performModularNesting(pieces, options);
      } catch {
        result = runNestingEngine(pieces, options);
      }
    }
  } else if (algorithm === 'BOUNDING_BOX') {
    result = runNestingEngine(pieces, options);
  } else {
    try {
      result = performModularNesting(pieces, options);
    } catch (err) {
      console.warn('[NestingWorkerClient] Error en algoritmo modular, ejecutando respaldo:', err);
      result = runNestingEngine(pieces, options);
    }
  }

  if (onProgress) onProgress(100);
  return deduplicateResultReferences(result);
}

/**
 * Termina cualquier Web Worker de nesting activo para liberar memoria inmediatamente.
 */
export function terminateActiveNestingWorkers(): void {
  for (const w of activeWorkers) {
    try {
      w.onmessage = null;
      w.onerror = null;
      w.terminate();
    } catch {
      // Ignorar errores al limpiar worker
    }
  }
  activeWorkers.clear();
}

/**
 * Ejecuta el motor de nesting (Modular Industrial, Poligonal o Bounding Box)
 * dentro de un Web Worker real cuando está disponible en navegador/Electron,
 * con fallback transparente en Node/Vitest y liberación determinista del worker.
 */
export async function executeNestingWithWorker(
  pieces: NestingPieceInput[],
  options: NestingOptions,
  algorithm: NestingWorkerAlgorithm = 'MODULAR_INDUSTRIAL',
  onProgress?: (progress: number) => void
): Promise<NestingResult> {
  if (typeof Worker === 'undefined') {
    return executeDirectNesting(pieces, options, algorithm, onProgress);
  }

  return new Promise<NestingResult>((resolve) => {
    let worker: Worker | null = null;
    let settled = false;

    const cleanup = () => {
      if (worker) {
        activeWorkers.delete(worker);
        try {
          worker.onmessage = null;
          worker.onerror = null;
          worker.terminate();
        } catch {
          // Ignorar errores al terminar worker
        }
        worker = null;
      }
    };

    const fallbackToDirect = () => {
      if (settled) return;
      settled = true;
      cleanup();
      executeDirectNesting(pieces, options, algorithm, onProgress).then(resolve);
    };

    try {
      worker = new Worker(
        new URL('../../../workers/nestingWorker.ts', import.meta.url),
        { type: 'module' }
      );
      activeWorkers.add(worker);

      worker.onmessage = (event: MessageEvent<NestingWorkerResponse>) => {
        const data = event.data;
        if (!data || settled) return;

        if (data.type === 'PROGRESS') {
          if (onProgress && typeof data.progress === 'number') {
            onProgress(data.progress);
          }
          return;
        }

        if (data.type === 'COMPLETE' && data.result) {
          settled = true;
          cleanup();
          resolve(deduplicateResultReferences(data.result));
          return;
        }

        if (data.type === 'ERROR') {
          console.warn('[NestingWorkerClient] Error reportado por Worker, usando fallback:', data.error);
          fallbackToDirect();
        }
      };

      worker.onerror = () => {
        fallbackToDirect();
      };

      const message: NestingWorkerMessage = {
        type:
          algorithm === 'POLYGONAL_CLIPPER2'
            ? 'RUN_POLYGONAL_NESTING'
            : algorithm === 'MODULAR_INDUSTRIAL'
            ? 'RUN_MODULAR_NESTING'
            : 'RUN_NESTING',
        payload: {
          pieces,
          options,
          algorithm,
        },
      };

      worker.postMessage(message);
    } catch {
      fallbackToDirect();
    }
  });
}

/**
 * Cliente compatible para ejecución explícita del motor de nesting poligonal en Worker.
 */
export async function executePolygonalNestingWithWorker(
  pieces: NestingPieceInput[],
  options: NestingOptions,
  onProgress?: (progress: number) => void
): Promise<NestingResult> {
  return executeNestingWithWorker(pieces, options, 'POLYGONAL_CLIPPER2', onProgress);
}

