# Feature: Optimización Extrema de Memoria RAM y Rendimiento (Laptops 8 GB)

- **Feature Name:** `ram-optimization-lightweight-engine`
- **Objective:** Reducir drásticamente el consumo de memoria RAM de ~1.5 GB a < 150 MB y garantizar fluidez constante (60 FPS sin bloqueos de UI) en laptops estándar de 8 GB RAM mediante el patrón Flyweight, eliminación de fugas en WebAssembly/localStorage, virtualización de renderizado y activación real de Web Workers.
- **Why:** Las laptops de 8 GB RAM tienen solo ~2.5 GB de memoria física libre bajo Windows. La acumulación descontrolada de strings SVG en Zustand, las fugas en sentencias de SQLite WASM, la saturación del DOM con 30,000+ elementos y la ejecución pesada en el hilo principal provocan congelamientos y caídas por Out-Of-Memory.
- **Delivery Strategy:** `ask-on-risk` (SDD vocabulary heuristic)
- **TDD Mode:** Functional checks enabled (Vitest suite `npm test`)

---

## Tasks Checklist

- [x] **TASK-1: Blindaje de SQLite WASM y eliminación de cuellos de botella en localStorage**
  - **ID:** `TASK-1`
  - **Scope:** `src/core/database/db.ts`, `src/modules/designs/designStore.ts`, `src/modules/patterns/patternStore.ts`
  - **Description:** Envolver sentencias SQLite en `try ... finally { stmt.free(); }` para evitar fugas en el heap de WebAssembly. Eliminar sincronización de megabytes de SVG/polígonos en `localStorage` (que saturan el límite de 5 MB y bloquean el hilo principal) delegando 100% en IndexedDB/SQLite con debouncing en auto-guardado.
  - **Acceptance Criteria:** `db.test.ts` y pruebas existentes pasan sin fugas. Cero errores de `QuotaExceededError`.
  - **Route:** Delegated Direct (Writer trigger: 3 files).
  - **Evidence:** Commit `6e196b8`. Sentencias SQLite protegidas con `try ... finally { stmt.free(); }` en `query`, manejo seguro de excepciones en `run`, mutex de concurrencia en `persistBrowserDb`. Eliminada persistencia en `localStorage` en `designStore` y `patternStore`, reemplazando llamadas síncronas bloqueantes por `scheduleAutoSave()`. Pruebas ejecutadas con éxito: `npm test src/core/database/db.test.ts src/modules/designs/designRepository.test.ts src/modules/patterns/patternRepository.test.ts` (3 archivos, 8 tests pasados) y suite completa `npm test` (23 archivos, 106 tests pasados).

- [x] **TASK-2: Arquitectura Flyweight para Generador de Prendas y Store de Nesting**
  - **ID:** `TASK-2`
  - **Scope:** `src/modules/generator/types.ts`, `src/modules/generator/garmentGenerator.ts`, `src/modules/generator/generatorStore.ts`, `src/core/nesting/types.ts`, `src/core/nesting/nestingStore.ts`
  - **Description:** Rediseñar `GeneratedPiece` y `PlacedNestingPiece` para separar metadatos livianos (coordenadas, rotación, dimensiones, dorsales, tallas) del contenido SVG masivo. Almacenar el arte maestro una sola vez como plantilla y resolver el ensamblado completo únicamente bajo demanda (streaming durante exportación o previsualización individual). Eliminar la triplicación en `nestingStore`.
  - **Acceptance Criteria:** La memoria para un pedido de 50+ jugadores pasa de cientos de megabytes a < 5 MB en Zustand. Pruebas de generador y exportación pasan.
  - **Route:** Delegated Direct (Writer trigger: 5 files).
  - **Evidence:** Commit `57bd788`. Implementada arquitectura Flyweight en `garmentGenerator.ts` con `pieceSvgRegistry` fuera del estado reactivo de Zustand y resolución bajo demanda mediante `resolvePieceSvg` / `getPieceSvgContent`. Implementado caché de arte escalado por molde/talla (`getCachedNormalizedArtwork` y `getCachedScaledArtwork`) eliminando normalización y escalado redundante en jugadores repetidos. Eliminada la triplicación en `nestingStore` (`placedPieces`, `sheets` y `nestingResult` comparten referencias; `svgContent` se extrae al registry durante el acomodo y no satura los metadatos geométricos durante `movePiece`, `rotatePiece` o `toggleLockPiece`). Actualizados exportadores (`svgExporter`, `pdfExporter`, `exportService`) y vistas (`ProductionNestingView`, `GarmentInspectionTab`). Pruebas requeridas y suite completa al 100%: 24 archivos, 111 tests pasados (`npm test`), y compilación exitosa (`npm run build`).

- [x] **TASK-3: Estabilización de Event Listeners y Viewport Culling en el Lienzo**
  - **ID:** `TASK-3`
  - **Scope:** `src/modules/canvas/useInteractiveCanvas.ts`, `src/modules/canvas/snappingService.ts`, `src/views/ProductionNestingView.tsx`
  - **Description:** Migrar estado de arrastre en `useInteractiveCanvas` a `useRef` para evitar desmonte/remonte masivo (60-120x/seg) de listeners en `window`. Implementar Viewport Culling (recorte de piezas fuera de la vista) y representación visual ligera para que el DOM no mantenga miles de nodos SVG activos a la vez.
  - **Acceptance Criteria:** Paneo y arrastre fluidos a 60 FPS sin fugas de listeners ni caídas de frames.
  - **Route:** Delegated Direct (Writer trigger: 3 files).
  - **Evidence:** Commit `9168d2b`. Listeners globales (`mousemove`, `mouseup`, `keydown`) estabilizados con referencias mutables (`useRef`) y sincronización coalescida con `requestAnimationFrame`. Filtrado espacial por proximidad $O(1)$ en `snappingService.ts`. Viewport Culling con `ResizeObserver` y margen de overscan, componente `CanvasPieceItem` envuelto en `React.memo` y modo ligero (LOD) automático en zoom lejano o alta densidad. Pruebas `snappingService.test.ts` (5/5 pasadas) y compilación limpia (`tsc --noEmit`).

- [x] **TASK-4: Conexión y Activación Real del Web Worker de Nesting**
  - **ID:** `TASK-4`
  - **Scope:** `src/workers/nestingWorker.ts`, `src/core/nesting/worker/nestingWorkerClient.ts`, `src/core/nesting/nestingStore.ts`
  - **Description:** Reemplazar el `setTimeout` falso de `nestingWorkerClient.ts` instanciando un `new Worker()` real con Vite. Delegar el cálculo del acomodo modular continuo (`performModularNesting`) y poligonal al worker en segundo plano, notificando progreso mediante mensajes sin bloquear la interfaz.
  - **Acceptance Criteria:** La UI permanece 100% interactiva durante el cálculo de nesting. `modularNestingEngine.test.ts` y tests de nesting pasan.
  - **Route:** Delegated Direct (Writer trigger: 3 files).
  - **Evidence:** Commit `0ae6f16`. Instanciación real de `new Worker(new URL('../../../workers/nestingWorker.ts', import.meta.url), { type: 'module' })` con soporte para `MODULAR_INDUSTRIAL`, `POLYGONAL_CLIPPER2` y `BOUNDING_BOX`, limpieza determinista de workers (`terminate()`), reconciliación de referencias tras Structured Clone y fallback transparente en entorno Node/Vitest. Empaquetado verificado en producción (`dist/assets/nestingWorker-DStQSuIa.js`) y pruebas en verde (3 archivos, 13 tests pasados).

- [x] **TASK-5: Aceleración Algorítmica y Caché Tipográfica**
  - **ID:** `TASK-5`
  - **Scope:** `src/modules/orders/orderValidator.ts`, `src/core/fonts/textVectorEngine.ts`, `src/core/fonts/fontManager.ts`
  - **Description:** Optimizar la validación de dorsales repetidos a $O(N)$ mediante `Map`/`Set` en lugar de $O(N^2)$. Implementar memoización en `textVectorEngine` para no re-vectorizar glifos y números idénticos (ej. "10", tallas "M") cientos de veces.
  - **Acceptance Criteria:** Escribir en la tabla de nómina es instantáneo. Pruebas de tipografía y validación de órdenes pasan.
  - **Route:** Delegated Direct (Writer trigger: 3 files).
  - **Evidence:** Commit `2469ef8`. Validación de dorsales únicos optimizada a $O(N)$ con `numberFrequencyMap` precalculado en `validateOrderList`. Caché LRU de 2,000 entradas en `textVectorEngine.ts` (`getMemoizedVectorPath`) y caché LRU de 16 fuentes con deduplicación de alias (`fontAliasMap`) y liberación de `ArrayBuffer` en `fontManager.ts`. Pruebas en verde (3 archivos, 18 tests pasados).

- [x] **TASK-6: Verificación Integral End-to-End, Auditoría de Casos Borde y Correcciones**
  - **ID:** `TASK-6`
  - **Scope:** Suite completa de pruebas (`npm test`), verificación de compilación (`npm run build`) y auditoría profunda de casos borde (`clipperService.ts`, `garmentGenerator.ts`, `namespaceSvgIds.ts`, `nestingStore.ts`, `useInteractiveCanvas.ts`, `ProductionNestingView.tsx`, `NewOrderView.tsx`, `db.ts`, `designStore.ts`, `patternStore.ts`, `PatternsView.tsx`).
  - **Description:** Ejecutar todos los 111+ tests unitarios y de integración y corregir los 13 casos borde detectados en la revisión profunda de código.
  - **Acceptance Criteria:** Todos los tests pasan en verde sin regresiones.
  - **Route:** Delegated Direct.
  - **Evidence:** Commit `58f63ec`. Corregidos los 13 hallazgos de la auditoría: (1) detección de `WorkerGlobalScope` en `clipperService.ts` y reset de `initPromise` en fallo; (2) huella FNV-1a (`computeArtworkFingerprint`) en caché de arte escalado para evitar colisión entre cuellos V/Redondo; (3) `flex-shrink-0` en el contenedor del rollo y overscan `800px` en `ProductionNestingView.tsx`; (4) IDs deterministas en `garmentGenerator.ts` y limpieza de `pieceSvgRegistry` al regenerar; (5) preservación de piezas con candado (`isLocked`) en `reoptimizeUnlocked`; (6) uso de `printableWidthMm` y `spacingMm` de `nestingStore` en `useInteractiveCanvas.ts` y corrección de `fitToAll`; (7) cancelación de workers previos con `terminateActiveNestingWorkers()` y `currentRunId`; (8) verificación de `getRowsModified() > 0` antes de disparar auto-save en `db.ts`; (9–13) filtrado de snapping por pliego (`sheetIndex`), persistencia de IDs activos livianos (~30 bytes) y preservación de `unassignedPieces`. Suite completa `npm test`: 24 archivos pasados, 111 tests en verde (0 fallos).
