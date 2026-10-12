import { useState, useRef, useCallback, useEffect } from 'react';
import { useNestingStore } from '@/core/nesting/nestingStore';
import { PlacedNestingPiece } from '@/core/nesting/types';
import { useProfileStore } from '@/modules/settings/profileStore';
import { calculateSnapping } from './snappingService';
import { CanvasDragState } from './types';
import { showAlert } from '@/core/ui/alerts';

const INITIAL_DRAG_STATE: CanvasDragState = {
  isDragging: false,
  pieceId: null,
  startClientX: 0,
  startClientY: 0,
  originalPieceX: 0,
  originalPieceY: 0,
  currentPieceX: 0,
  currentPieceY: 0,
  activeGuides: [],
};

export function useInteractiveCanvas() {
  const { activeProfile } = useProfileStore();
  const {
    placedPieces,
    selectedPieceId,
    setSelectedPieceId,
    movePiece,
    rotatePiece,
    toggleLockPiece,
    printableWidthMm,
    spacingMm,
  } = useNestingStore();

  const [zoomLevel, setZoomLevelState] = useState<number>(100); // Vista fija y legible del rollo
  const [pan, setPanState] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanningState] = useState<boolean>(false);
  const [dragState, setDragState] = useState<CanvasDragState>(INITIAL_DRAG_STATE);

  // Referencias mutables para estabilizar los listeners de window (0 re-suscripciones durante arrastre/paneo)
  const zoomLevelRef = useRef<number>(zoomLevel);
  const panRef = useRef<{ x: number; y: number }>(pan);
  const isPanningRef = useRef<boolean>(isPanning);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragStateRef = useRef<CanvasDragState>(dragState);
  const placedPiecesRef = useRef<PlacedNestingPiece[]>(placedPieces);
  const selectedPieceIdRef = useRef<string | null>(selectedPieceId);
  const activeProfileRef = useRef(activeProfile);
  const printableWidthMmRef = useRef<number>(printableWidthMm);
  const spacingMmRef = useRef<number>(spacingMm);
  const actionsRef = useRef({
    setSelectedPieceId,
    movePiece,
    rotatePiece,
    toggleLockPiece,
  });

  // Contexto pre-filtrado de la pieza arrastrada para evitar .find() y .filter() en cada píxel de mousemove
  const dragContextRef = useRef<{
    pieceId: string | null;
    draggedPiece: PlacedNestingPiece | null;
    otherPieces: PlacedNestingPiece[];
  }>({
    pieceId: null,
    draggedPiece: null,
    otherPieces: [],
  });

  const rafIdRef = useRef<number | null>(null);

  // Mantener referencias sincronizadas con el último render
  zoomLevelRef.current = zoomLevel;
  panRef.current = pan;
  isPanningRef.current = isPanning;
  placedPiecesRef.current = placedPieces;
  selectedPieceIdRef.current = selectedPieceId;
  activeProfileRef.current = activeProfile;
  printableWidthMmRef.current = printableWidthMm;
  spacingMmRef.current = spacingMm;
  actionsRef.current = {
    setSelectedPieceId,
    movePiece,
    rotatePiece,
    toggleLockPiece,
  };

  const setZoomLevel = useCallback((updater: number | ((prev: number) => number)) => {
    setZoomLevelState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      zoomLevelRef.current = next;
      return next;
    });
  }, []);

  const setPan = useCallback(
    (updater: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => {
      setPanState((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        panRef.current = next;
        return next;
      });
    },
    []
  );

  const mmToPx = (zoomLevel / 100) * 0.75;

  const scheduleUiSync = useCallback(() => {
    if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
      if (isPanningRef.current) {
        setPanState({ ...panRef.current });
      }
      if (dragStateRef.current.isDragging) {
        setDragState({ ...dragStateRef.current });
      }
      return;
    }

    if (rafIdRef.current !== null) return;

    rafIdRef.current = window.requestAnimationFrame(() => {
      rafIdRef.current = null;
      if (isPanningRef.current) {
        setPanState({ ...panRef.current });
      }
      if (dragStateRef.current.isDragging) {
        setDragState({ ...dragStateRef.current });
      }
    });
  }, []);

  // Iniciar arrastre de una pieza
  const handlePieceMouseDown = useCallback(
    (
      e: React.MouseEvent,
      pieceId: string,
      initialX: number,
      initialY: number
    ) => {
      e.stopPropagation();
      if (e.button !== 0) return; // Solo clic izquierdo para arrastrar pieza

      actionsRef.current.setSelectedPieceId(pieceId);

      const pieces = placedPiecesRef.current;
      const draggedPiece = pieces.find((p) => p.id === pieceId) || null;
      const otherPieces = draggedPiece
        ? pieces.filter(
            (p) =>
              p.id !== draggedPiece.id &&
              (p.sheetIndex ?? 0) === (draggedPiece.sheetIndex ?? 0)
          )
        : [];
      dragContextRef.current = {
        pieceId,
        draggedPiece,
        otherPieces,
      };

      const nextDragState: CanvasDragState = {
        isDragging: true,
        pieceId,
        startClientX: e.clientX,
        startClientY: e.clientY,
        originalPieceX: initialX,
        originalPieceY: initialY,
        currentPieceX: initialX,
        currentPieceY: initialY,
        activeGuides: [],
      };

      dragStateRef.current = nextDragState;
      setDragState(nextDragState);
    },
    []
  );

  // Iniciar paneo del lienzo
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    // Paneo con botón central (rueda) o botón secundario o clic en fondo vacío
    if (e.button === 1 || e.button === 0) {
      if (e.button === 0 && (e.target as HTMLElement).closest('[data-piece="true"]')) {
        return; // Si hizo clic en una pieza, no panear
      }
      isPanningRef.current = true;
      setIsPanningState(true);
      panStartRef.current = {
        x: e.clientX - panRef.current.x,
        y: e.clientY - panRef.current.y,
      };
    }
  }, []);

  // Ajustar el rollo al ancho visible de la pantalla (Modo óptimo de taller)
  const fitToWidth = useCallback((containerWidthPx: number = 1100) => {
    const targetWidthMm = printableWidthMmRef.current || activeProfileRef.current.printableWidthMm || 1120;
    const desiredZoom = Math.round(((containerWidthPx * 0.82) / (targetWidthMm * 0.75)) * 100);
    const clampedZoom = Math.max(30, Math.min(160, desiredZoom));
    setZoomLevel(clampedZoom);
    setPan({ x: 0, y: 20 });
  }, [setZoomLevel, setPan]);

  // Ajustar el rollo completo (largo y ancho) para ver la bobina entera
  const fitToAll = useCallback((containerHeightPx: number = 650, rollLengthMm: number = 4000) => {
    const targetWidthMm = printableWidthMmRef.current || activeProfileRef.current.printableWidthMm || 1120;
    const totalRollMm = Math.max(800, rollLengthMm, targetWidthMm);
    const desiredZoom = Math.round(((containerHeightPx * 0.85) / (totalRollMm * 0.75)) * 100);
    const clampedZoom = Math.max(12, Math.min(80, desiredZoom));
    setZoomLevel(clampedZoom);
    setPan({ x: 0, y: 10 });
  }, [setZoomLevel, setPan]);

  // Manejador de rueda: Rueda normal = scroll vertical / horizontal; Ctrl+Rueda = Zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      // Zoom con Ctrl + Rueda
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      setZoomLevel((current) => {
        const next = Math.round(current * zoomFactor);
        return Math.max(12, Math.min(300, next));
      });
    } else if (e.shiftKey) {
      // Scroll horizontal con Shift + Rueda
      setPan((p) => ({ ...p, x: p.x - e.deltaY }));
    } else {
      // Scroll vertical natural con rueda del ratón
      setPan((p) => ({ ...p, y: p.y - e.deltaY }));
    }
  }, [setZoomLevel, setPan]);

  // Registrar listeners globales una única vez al montar (estables vía useRef)
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      // 1. Manejo de Paneo
      if (isPanningRef.current) {
        panRef.current = {
          x: e.clientX - panStartRef.current.x,
          y: e.clientY - panStartRef.current.y,
        };
        scheduleUiSync();
        return;
      }

      // 2. Manejo de Arrastre de Pieza con Snapping Magnético
      const currentDrag = dragStateRef.current;
      if (currentDrag.isDragging && currentDrag.pieceId) {
        const currentMmToPx = (zoomLevelRef.current / 100) * 0.75;
        const dxPx = e.clientX - currentDrag.startClientX;
        const dyPx = e.clientY - currentDrag.startClientY;

        const dxMm = dxPx / currentMmToPx;
        const dyMm = dyPx / currentMmToPx;

        const rawTargetX = currentDrag.originalPieceX + dxMm;
        const rawTargetY = currentDrag.originalPieceY + dyMm;

        let draggedPiece = dragContextRef.current.draggedPiece;
        let otherPieces = dragContextRef.current.otherPieces;
        if (!draggedPiece || dragContextRef.current.pieceId !== currentDrag.pieceId) {
          const pieces = placedPiecesRef.current;
          const foundPiece = pieces.find((p) => p.id === currentDrag.pieceId) || null;
          draggedPiece = foundPiece;
          otherPieces = foundPiece
            ? pieces.filter(
                (p) =>
                  p.id !== foundPiece.id &&
                  (p.sheetIndex ?? 0) === (foundPiece.sheetIndex ?? 0)
              )
            : [];
          dragContextRef.current = {
            pieceId: currentDrag.pieceId,
            draggedPiece,
            otherPieces,
          };
        }

        if (!draggedPiece) return;

        const profile = activeProfileRef.current;
        const snap = calculateSnapping({
          currentX: rawTargetX,
          currentY: rawTargetY,
          widthMm: draggedPiece.effectiveWidthMm,
          heightMm: draggedPiece.effectiveHeightMm,
          printableWidthMm: printableWidthMmRef.current || profile.printableWidthMm || 1120,
          spacingMm: spacingMmRef.current ?? profile.pieceSpacingMm ?? 3.0,
          otherPieces,
          thresholdMm: 14.0, // Imantación perceptible
        });

        dragStateRef.current = {
          ...currentDrag,
          currentPieceX: snap.snappedX,
          currentPieceY: snap.snappedY,
          activeGuides: snap.guides,
        };

        scheduleUiSync();
      }
    };

    const onMouseUp = () => {
      if (rafIdRef.current !== null && typeof window !== 'undefined') {
        window.cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }

      if (isPanningRef.current) {
        isPanningRef.current = false;
        setIsPanningState(false);
        setPanState({ ...panRef.current });
      }

      const currentDrag = dragStateRef.current;
      if (currentDrag.isDragging && currentDrag.pieceId) {
        // Guardar la nueva posición en el almacén de nesting (bloquea automáticamente la pieza)
        const moved = actionsRef.current.movePiece(
          currentDrag.pieceId,
          currentDrag.currentPieceX,
          currentDrag.currentPieceY
        );
        if (!moved) {
          showAlert.toast('warning', 'Posición rechazada: colisión o separación insuficiente');
        }

        dragContextRef.current = {
          pieceId: null,
          draggedPiece: null,
          otherPieces: [],
        };
        dragStateRef.current = INITIAL_DRAG_STATE;
        setDragState(INITIAL_DRAG_STATE);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      // Si el foco está en un input, ignorar atajos
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      const currentSelectedId = selectedPieceIdRef.current;
      if (!currentSelectedId) return;

      const piece = placedPiecesRef.current.find((p) => p.id === currentSelectedId);
      if (!piece) return;

      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        const rotated = actionsRef.current.rotatePiece(currentSelectedId, 90);
        if (!rotated) {
          showAlert.toast('warning', 'No se puede rotar aquí: mueve la pieza a un espacio libre');
        }
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        actionsRef.current.toggleLockPiece(currentSelectedId);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        actionsRef.current.movePiece(currentSelectedId, piece.xMm - step, piece.yMm);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        actionsRef.current.movePiece(currentSelectedId, piece.xMm + step, piece.yMm);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        actionsRef.current.movePiece(currentSelectedId, piece.xMm, piece.yMm - step);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        actionsRef.current.movePiece(currentSelectedId, piece.xMm, piece.yMm + step);
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      if (rafIdRef.current !== null && typeof window !== 'undefined') {
        window.cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [scheduleUiSync]);

  return {
    zoomLevel,
    setZoomLevel,
    pan,
    setPan,
    isPanning,
    dragState,
    mmToPx,
    handlePieceMouseDown,
    handleCanvasMouseDown,
    handleWheel,
    fitToWidth,
    fitToAll,
  };
}
