# Feature: Rediseño Minimalista Claro y Reestructuración de Procesos de Producción Textil

- **Feature Name:** `minimalist-light-redesign-and-process-overhaul`
- **Repository Locator:** `odd/tasks/minimalist-light-redesign-and-process-overhaul.md`
- **Engram Topic Key:** `odd/minimalist-light-redesign-and-process-overhaul/tasks`
- **Base Branch / Commit:** `main` (`0cee5e3`) -> `feat/minimalist-light-redesign-and-process-overhaul`
- **Delivery Strategy:** `ask-on-risk` (Forecast: ~1,400 authored lines across 4 comprehensive tasks)
- **TDD Mode:** Functional checks enabled (`npm test` via `vitest run` & `npm run build` via `tsc && vite build`; source: existing project configuration in `package.json`)
- **RDD Status:** CLI `gentle-ai` not installed in environment (`unavailable`); strict functional testing (`npm test`) and live browser verification enforced on every task.

---

## Objective, Problem & Why

- **Problem:** 
  1. El sistema actual tiene una interfaz saturada con temas oscuros forzados (`bg-slate-950`, `bg-slate-900`) que alteran la percepción de colores textiles entre diferentes monitores y sistemas operativos.
  2. La barra lateral es estática y ancha (`w-64`), quitando protagonismo al lienzo de trabajo de diseño y nesting.
  3. En Diseños y Moldes, se fuerza una dualidad innecesaria entre "frente redondo" y "frente cuello V" con alertas de error que bloquean la producción de uniformes cuando el diseñador solo cargó una variante. Además existe un botón inoperante ("Ajustar pieza") y no hay plantilla descargable para Adobe Illustrator.
  4. El panel de configuración de número/dorsal está expandido fijamente sobre las piezas de arte y permite filetes/bordes gruesos que duplican trazados en el corte por láser.
  5. La plantilla Excel carece de selectores desplegables (`select`), los datos de pedido se borran al recargar (`F5`), y los pliegos de impresión de más de 5 metros saturan los RIPs y Adobe Illustrator.
- **Why:**
  Adaptar la arquitectura a un estándar minimalista, centralizado en **Tema Claro (Light Mode)** profesional similar al referente industrial Sublimifyer, maximizando el espacio de visualización, blindando el motor de nesting (nuestro punto fuerte) y resolviendo las fricciones operativas detectadas en taller.

## Authorized Scope & Constraints

- **Authorized Scope:**
  1. **Shell UI & Tema Claro:** Estandarizar toda la aplicación en Tema Claro puro. Reemplazar la barra lateral por un riel de iconos compacto (`w-16` expandible a `w-60` con toggle) y eliminar estilos oscuros hardcodeados.
  2. **Diseños y Moldes:** Simplificar el frente a una única ranura universal (`DELANTERO`), compatible automáticamente con moldes redondo y V. Retirar el botón "Ajustar pieza". Generar plantilla editable en SVG para diseñadores en Adobe Illustrator con capas (`CORTE`, `COSTURA`, `GUÍAS`).
  3. **Tipografías y Dorsal:** Mover la configuración de dorsal a un modal emergente limpio. Eliminar opciones de bordes/fondos duplicados. Agregar soporte de fuentes `.ttf`, `.otf`, `.font` y modal de ayuda. Simplificar la activación de la marquilla de talla interna a 1 clic.
  4. **Pedidos y Exportación:** Incorporar validación de datos (dropdowns `select`) en la plantilla Excel descargable. Sincronizar tallas con el molde activo. Agregar persistencia `localStorage`/`IndexedDB` a `orderStore`. Habilitar nómina manual. Segmentar automáticamente los pliegos de sublimación en tramos de 2 a 5 metros con desplazamiento limpio y retirar opciones obsoletas de exportación.
- **Constraints:**
  - Preservar al 100% la precisión matemática del motor de nesting poligonal Clipper2 y el pipeline de empaquetado 1:1.
  - No generar regresiones en ninguna de las 192 pruebas existentes de `vitest`.

---

## Actionable Checklist

- [x] **TASK-1: Shell UI, Layout Minimalista y Sidebar Colapsable en Tema Claro Estandarizado (Icon Rail)**
  - **ID:** `TASK-1`
  - **Route:** Delegated Direct (Writer trigger: touches `src/components/Sidebar.tsx`, `src/views/WorkshopApp.tsx`, `src/components/Header.tsx`, `src/modules/settings/themeStore.ts`, `src/styles/globals.css`).
  - **Scope:** Convertir la barra lateral en riel colapsable (`w-16` / `w-60` con tooltips y botón toggle). Estandarizar `themeStore.ts` en `light` por defecto y eliminar herencia oscura. Depurar fondos oscuros hardcodeados de la vista principal del taller para lograr una estética minimalista, limpia y luminosa.
  - **Acceptance Criteria:**
    - La barra lateral se contrae a un riel de iconos compacto o se expande sin superponerse incorrectamente.
    - El fondo de la aplicación es blanco/gris claro neutro con bordes sutiles y contrastes óptimos.
    - Al recargar, la aplicación permanece siempre en tema claro estandarizado.
  - **Checks:** `npm test` (192/192 tests passed).
  - **Evidence / Commit:** Commit `e3a36a4` (`feat(ui): standardize minimalist light theme and collapsible icon rail sidebar`).

- [x] **TASK-2: Simplificación del Frente a Ranura Única (`DELANTERO`), Depuración del Botón Obsoleto y Plantilla Descargable para Illustrator**
  - **ID:** `TASK-2`
  - **Route:** Delegated Direct (Writer trigger: touches `src/views/DesignsView.tsx`, `src/components/textile/TextilePieceCarousel.tsx`, `src/views/PatternsView.tsx`, `src/modules/generator/garmentGenerator.ts`, `src/modules/production/productionPreflight.ts`).
  - **Scope:** En `DesignsView.tsx` y carrusel de piezas, eliminar la ranura de "frente redondo" y dejar un único "Frente". Eliminar el botón "Ajustar pieza" de `TextilePieceCarousel.tsx`. Eliminar la alerta de "delantero genérico antiguo". En `garmentGenerator.ts`, garantizar que el frente único cubra pedidos con cuello V o Redondo sin generar advertencias de piezas faltantes. En `PatternsView.tsx`, agregar el botón y generador de "Descargar plantilla" editable en SVG/PDF para Illustrator.
  - **Acceptance Criteria:**
    - El diseñador solo carga 1 arte de "Frente" y se generan correctamente prendas tanto de cuello V como Redondo.
    - No existe el botón "Ajustar pieza" en la interfaz.
    - Se puede descargar la plantilla SVG de moldes con capas vectoriales claras.
  - **Checks:** `npx vitest run src/modules/generator/garmentGenerator.test.ts src/modules/patterns/patternTemplateExporter.test.ts` (7/7 tests passed) + `npm test` (193/193 tests passed).
  - **Evidence / Commit:** Commit `720adb9` (`feat(patterns): unify front slot, remove obsolete adjust button and add illustrator template exporter`).

- [x] **TASK-3: Modal Desplegable de Dorsales/Tipografías, Eliminación de Bordes Duplicados y Marquillas de Talla en Dobladillo**
  - **ID:** `TASK-3`
  - **Route:** Delegated Direct (Writer trigger: touches `src/views/DesignsView.tsx`, `src/views/DorsalConfigModal.tsx`, `src/views/GarmentInspectionTab.tsx`).
  - **Scope:** Ocultar el panel fijo de dorsal y abrirlo desde un botón "Configurar Dorsal / Números" en modal flotante. Remover ajustes de filete/borde exterior grueso y fondo para evitar dobles trazados al exportar a Illustrator. Permitir carga de archivos `.ttf`, `.otf`, `.font` con modal instructivo de Google Fonts. En `GarmentInspectionTab.tsx`, simplificar el toggle de marquilla interna de talla a un solo clic y renombrar "Todo a Posición Original" a "Restablecer posiciones predeterminadas".
  - **Acceptance Criteria:**
    - El panel superior de dorsal ya no satura la pantalla; se abre limpiamente en modal.
    - Los dorsales se exportan con contornos limpios sin duplicidad de vectores.
    - El botón de marquilla de talla interna responde a 1 solo clic.
    - El botón de restablecer tiene el nombre claro y entendible.
  - **Checks:** `npm test` (37 passed test files, 193 passed tests).
  - **Evidence / Commit:** Commit `e33c466` (`feat(ui): add dorsal config modal, single-click size marks, and clean typography controls`).

- [x] **TASK-4: Plantilla Excel con Dropdowns Nativos, Persistencia `F5`, Nómina Manual y Segmentación de Pliegos (2 a 5 metros)**
  - **ID:** `TASK-4`
  - **Route:** Delegated Direct (Writer trigger: touches `src/modules/orders/excelParser.ts`, `src/modules/orders/orderStore.ts`, `src/views/NewOrderView.tsx`, `src/modules/export/ExportModal.tsx`, `src/core/nesting/modularNestingEngine.ts`, `src/views/ProductionNestingView.tsx`).
  - **Scope:** Incorporar validación de datos nativa en la plantilla Excel descargada (`select` para Tipo Prenda y Cuello). Sincronizar automáticamente las tallas del molde activo con el pedido. Agregar persistencia a `orderStore` (evitar borrado al refrescar). Habilitar tabla de adición manual de jugadores. Implementar segmentación automática de pliegos largos en tramos de 2 a 5 metros en el motor de nesting y visualizador con scroll limpio. Eliminar casillas obsoletas de calibración física y línea de corte en el modal de exportación.
  - **Acceptance Criteria:**
    - La plantilla Excel abre con menús desplegables en Excel/LibreOffice.
    - Al recargar con `F5`, los pedidos permanecen intactos en pantalla.
    - Se pueden agregar jugadores manualmente fila a fila.
    - Pliegos mayores a 5 metros se fraccionan automáticamente en partes descargables sin colapsar Illustrator.
  - **Checks:** `npx vitest run src/modules/orders/ src/modules/export/ src/core/nesting/` + `npm test` (37 test suites, 193 passed) + `npm run build` (tsc & vite build clean, 0 errors).
  - **Evidence / Commit:** Commit `5b40075` (`feat(orders): excel dropdowns, order persistence, manual roster entry, and pliego segmentation`).

---

## Progress, Verification Evidence & Next Step

- **Current Status:** 100% de tareas completadas (TASK-1, TASK-2, TASK-3, TASK-4) en la rama `feat/minimalist-light-redesign-and-process-overhaul`.
- **Verification Evidence:**
  - `npm test`: 37 test files passed, 193 tests passed, 0 failures.
  - `npm run build`: Compilación TypeScript estricta y empaquetado Vite completados sin errores.
  - Commit `e3a36a4`: Shell UI y Sidebar colapsable estandarizados en tema claro.
  - Commit `720adb9`: Frente unificado `DELANTERO`, botón "Ajustar pieza" eliminado, exportador de plantilla descargable para Adobe Illustrator.
  - Commit `e33c466`: Modal desplegable de dorsales con soporte `.ttf`/`.otf`/`.font` y guía Google Fonts, marquilla interna 1-clic y "Restablecer posiciones predeterminadas".
  - Commit `5b40075`: Plantilla Excel con dropdowns nativos, persistencia `F5`, nómina manual, segmentación de pliegos (2 a 5 metros) y modal de exportación limpio en Tema Claro.
- **Next Step:** Trabajo completo y verificado. Presentar el balance final de la reestructuración al usuario.
