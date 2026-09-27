export interface ViewportTransform {
  zoom: number; // Factor de escala (1.0 = 100%)
  panX: number; // Desplazamiento horizontal en píxeles
  panY: number; // Desplazamiento vertical en píxeles
}

export interface SnapGuide {
  type: 'vertical' | 'horizontal';
  positionMm: number;
  label?: string;
}

export interface SnapResult {
  snappedX: number;
  snappedY: number;
  guides: SnapGuide[];
  hasSnappedX: boolean;
  hasSnappedY: boolean;
}

export interface CanvasDragState {
  isDragging: boolean;
  pieceId: string | null;
  startClientX: number;
  startClientY: number;
  originalPieceX: number;
  originalPieceY: number;
  currentPieceX: number;
  currentPieceY: number;
  activeGuides: SnapGuide[];
}
