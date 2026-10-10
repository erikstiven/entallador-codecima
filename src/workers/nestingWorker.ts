import { runPolygonalNesting } from '../core/nesting/polygonal/polygonalNestingEngine';
import { performModularNesting } from '../core/nesting/modularNestingEngine';
import { runNestingEngine } from '../core/nesting/nestingEngine';
import { NestingPieceInput, NestingOptions, NestingResult } from '../core/nesting/types';

export type NestingWorkerAlgorithm = 'MODULAR_INDUSTRIAL' | 'POLYGONAL_CLIPPER2' | 'BOUNDING_BOX';

export interface NestingWorkerMessage {
  type: 'RUN_NESTING' | 'RUN_MODULAR_NESTING' | 'RUN_POLYGONAL_NESTING';
  payload: {
    pieces: NestingPieceInput[];
    options: NestingOptions;
    algorithm?: NestingWorkerAlgorithm;
  };
}

export interface NestingWorkerResponse {
  type: 'PROGRESS' | 'COMPLETE' | 'ERROR';
  progress?: number;
  result?: NestingResult;
  error?: string;
}

const postWorkerMessage = (msg: NestingWorkerResponse) => {
  if (typeof self !== 'undefined' && typeof self.postMessage === 'function') {
    self.postMessage(msg);
  }
};

export async function handleNestingWorkerMessage(
  data: NestingWorkerMessage,
  onPostMessage: (msg: NestingWorkerResponse) => void = postWorkerMessage
): Promise<void> {
  const { type, payload } = data;

  if (
    type !== 'RUN_NESTING' &&
    type !== 'RUN_MODULAR_NESTING' &&
    type !== 'RUN_POLYGONAL_NESTING'
  ) {
    return;
  }

  const { pieces, options } = payload;
  const algorithm: NestingWorkerAlgorithm =
    type === 'RUN_POLYGONAL_NESTING'
      ? 'POLYGONAL_CLIPPER2'
      : type === 'RUN_MODULAR_NESTING'
      ? 'MODULAR_INDUSTRIAL'
      : payload.algorithm ?? 'MODULAR_INDUSTRIAL';

  try {
    onPostMessage({ type: 'PROGRESS', progress: 15 });

    let result: NestingResult;

    if (algorithm === 'POLYGONAL_CLIPPER2') {
      try {
        result = await runPolygonalNesting(pieces, options, (progress) => {
          onPostMessage({
            type: 'PROGRESS',
            progress: Math.min(99, Math.max(15, Math.round(progress))),
          });
        });
      } catch {
        try {
          result = performModularNesting(pieces, options);
        } catch {
          result = runNestingEngine(pieces, options);
        }
      }
    } else if (algorithm === 'BOUNDING_BOX') {
      onPostMessage({ type: 'PROGRESS', progress: 50 });
      result = runNestingEngine(pieces, options);
    } else {
      onPostMessage({ type: 'PROGRESS', progress: 40 });
      try {
        result = performModularNesting(pieces, options);
      } catch {
        result = runNestingEngine(pieces, options);
      }
    }

    onPostMessage({ type: 'PROGRESS', progress: 100 });
    onPostMessage({
      type: 'COMPLETE',
      result,
    });
  } catch (err: any) {
    onPostMessage({
      type: 'ERROR',
      error: err?.message || String(err),
    });
  }
}

// Escuchar mensajes en el worker (Web Worker context)
if (typeof self !== 'undefined') {
  self.onmessage = async (event: MessageEvent<NestingWorkerMessage>) => {
    if (!event?.data) return;
    await handleNestingWorkerMessage(event.data, postWorkerMessage);
  };
}

