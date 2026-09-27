import { runPolygonalNesting } from '../core/nesting/polygonal/polygonalNestingEngine';
import { NestingPieceInput, NestingOptions } from '../core/nesting/types';

export interface NestingWorkerMessage {
  type: 'RUN_POLYGONAL_NESTING';
  payload: {
    pieces: NestingPieceInput[];
    options: NestingOptions;
  };
}

export interface NestingWorkerResponse {
  type: 'PROGRESS' | 'COMPLETE' | 'ERROR';
  progress?: number;
  result?: any;
  error?: string;
}

// Escuchar mensajes en el worker (Web Worker context)
self.onmessage = async (event: MessageEvent<NestingWorkerMessage>) => {
  const { type, payload } = event.data;

  if (type === 'RUN_POLYGONAL_NESTING') {
    try {
      const result = await runPolygonalNesting(
        payload.pieces,
        payload.options,
        (progress) => {
          self.postMessage({
            type: 'PROGRESS',
            progress,
          } as NestingWorkerResponse);
        }
      );

      self.postMessage({
        type: 'COMPLETE',
        result,
      } as NestingWorkerResponse);
    } catch (err: any) {
      self.postMessage({
        type: 'ERROR',
        error: err?.message || String(err),
      } as NestingWorkerResponse);
    }
  }
};
