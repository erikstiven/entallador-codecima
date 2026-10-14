# Feature: Corrección Integral de Auditoría, Estandarización y Configuración del Sistema

## Context & Objectives
Implementación exhaustiva y estandarización del sistema tras la auditoría integral de código. Se abordan tokens CSS y bordes colapsados, sistema de botones con color configurable por el usuario, depuración de código muerto y herramientas en desuso, robustecimiento de la sincronización de pedidos y tallas, y persistencia de fuentes y ajustes.

- **Objective:** Corregir los 10 problemas críticos detectados en la auditoría, garantizando tema claro unificado, botones homogéneos y configurables, cero código muerto y persistencia confiable.
- **Why:** Resolver inconsistencias visuales, botones cuadrados sin radio por variable ausente, bugs en tallas de pedidos ("TALLA M"), duplicaciones en vistas de diseño y herramientas en desuso.
- **Constraints:** Mantener 100% de compatibilidad con el motor de nesting Clipper2, preservar todas las suites de pruebas pasando (`vitest run`), tema claro estricto (Light mode SaaS).

---

## Actionable Checklist

- [x] **TASK-1: Tokens CSS, Radio de Bordes y Sistema de Botón Configurable**
  - **ID:** `TASK-1`
  - **Route:** Delegated Direct (Writer trigger: touches `src/styles/globals.css`, `src/components/ui/Button.tsx`, `src/modules/settings/systemSettingsStore.ts`, `src/views/SettingsView.tsx`, `src/components/Header.tsx`, `src/components/Sidebar.tsx`).
  - **Scope:** 
    - Definir `--radius: 0.5rem;` (8px) en `src/styles/globals.css` `:root` para restaurar `rounded-lg/md/sm`.
    - Inyectar variables de color de marca (`--brand-primary`, `--brand-primary-hover`, `--brand-primary-light`, `--brand-primary-text`) en `:root`.
    - Crear componente universal `src/components/ui/Button.tsx`.
    - En `SettingsView.tsx`: Añadir selector de color de acento de marca (Violeta, Índigo, Azul Cobalto, Esmeralda, Ámbar) y limpiar opciones falsas de modo oscuro.
    - Sincronizar altura de Header (`h-14` / 56px) y Sidebar (`min-h-[58px]` -> `h-14`) y corregir `py-0.2` a `py-0.5`.
  - **Acceptance Criteria:**
    - Botones y tarjetas tienen radios de borde consistentes de 8px / 12px.
    - El color de los botones principales responde a la variable configurable del usuario.
    - Header y Sidebar alineados al pixel sin saltos.
  - **Checks:** `npx vitest run` (11 tests en `tests/ui/buttonAndBrandTokens.test.tsx` pasados) + `npx tsc --noEmit`.
  - **Evidence / Commit:** Verificado y completado.

- [x] **TASK-2: Depuración de Código Muerto y Herramientas en Desuso**
  - **ID:** `TASK-2`
  - **Route:** Delegated Direct (Writer trigger: touches `src/views/DesignsView.tsx`, `src/components/textile/TextilePieceCard.tsx`, `src/views/PatternsView.tsx`, `src/views/GarmentInspectionTab.tsx`).
  - **Scope:**
    - En `DesignsView.tsx`: Eliminar `PieceSlotCard` (106 líneas huérfanas), retirar 7 inputs file y `useRef` obsoletos. Unificar selectores a "Frente" único.
    - Eliminar o vaciar limpiamente `src/components/textile/TextilePieceCard.tsx`.
    - En `PatternsView.tsx`: Corregir `handleDownloadScript` añadiendo `link.click()`. Separar visualmente botones de papelera "Limpiar Moldes" y "Eliminar Molde" con modal de confirmación.
    - En `GarmentInspectionTab.tsx`: Estandarizar presets a tema claro, unificar los 3 botones redundantes de "Posición Original" a un único botón "Restablecer Posición Original", y actualizar el icono de "Pasar al Rollo" a `<ArrowRight>`.
  - **Acceptance Criteria:**
    - Cero componentes o inputs huérfanos.
    - Botón de script JSX en moldes descarga efectivamente el archivo `.jsx`.
    - Eliminado el riesgo de borrado accidental en moldes.
    - Inspección textil libre de clases oscuras residuales.
  - **Checks:** `npx vitest run` + `npx tsc --noEmit`.
  - **Evidence / Commit:** Verificado y completado.

- [x] **TASK-3: Sincronización de Pedidos, Tallas y Validación Robusta**
  - **ID:** `TASK-3`
  - **Route:** Delegated Direct (Writer trigger: touches `src/modules/orders/orderValidator.ts`, `src/modules/orders/orderStore.ts`, `src/views/NewOrderView.tsx`, `src/modules/patterns/patternStore.ts`).
  - **Scope:**
    - Corregir regex en `normalizeSizeName` para soportar tallas alfabéticas con prefijos (`TALLA M`, `T-L`, `SZ-S`).
    - En `orderStore.ts`: Cambiar la talla por defecto de `'28'` a la primera disponible del molde activo.
    - En `NewOrderView.tsx`: Cambiar input libre de talla en la tabla web por un `<select>` vinculado a `availableSizes`.
    - Añadir columna e input de "Cantidad" individual por jugador en la tabla de nómina de pedidos.
    - Actualizar `availableSizes` directamente en `patternStore.setActivePatternSet` y `loadFromDatabase`.
  - **Acceptance Criteria:**
    - `normalizeSizeName("TALLA M")` retorna `"M"` sin error de `SIZE_NOT_FOUND`.
    - La tabla de nómina permite editar la cantidad de cada jugador individualmente y seleccionar la talla desde un menú desplegable.
  - **Checks:** `npx vitest run` (7 tests en `orderValidator.test.ts` y 5 en `excelParser.test.ts` pasados).
  - **Evidence / Commit:** Verificado y completado.

- [x] **TASK-4: Fuentes Persistentes, Modal Instructivo y Limpieza de Exportación**
  - **ID:** `TASK-4`
  - **Route:** Delegated Direct (Writer trigger: touches `src/core/fonts/fontRepository.ts`, `src/core/fonts/googleFonts.ts`, `src/views/WorkshopApp.tsx`, `src/views/DesignsView.tsx`, `src/modules/export/ExportModal.tsx`).
  - **Scope:**
    - Crear `src/core/fonts/fontRepository.ts` para persistir fuentes subidas en IndexedDB (`cimatex_fonts_db`).
    - Restauración automática de fuentes al iniciar la aplicación en `WorkshopApp.tsx`.
    - Carga en vivo en `DesignsView.tsx`.
    - En `ExportModal.tsx`: Botón de exportación unificado con color de acento de marca dinámico (`btn-brand-primary`).
  - **Acceptance Criteria:**
    - Fuentes cargadas por el usuario persisten en IndexedDB y se auto-registran al recargar pantalla (F5).
    - Exportación limpia y clara sin opciones confusas, con botón primario dinámico de marca.
  - **Checks:** `npx vitest run` + `npx tsc --noEmit`.
  - **Evidence / Commit:** Verificado y completado.

---

## Progress, Verification Evidence & Next Step

- **Current Status:** Completado al 100%. Las 4 tareas han sido implementadas, verificadas y comprobadas sin regresiones.
- **Verification Evidence:**
  - `npx tsc --noEmit`: 0 errores de tipado TypeScript.
  - `npx vitest run`: 38 suites pasadas, 204 tests pasados, 0 fallos.
  - Servidor de desarrollo Vite activo y respondiendo.
- **Next Step:** Commit de unidad de trabajo en la rama `feat/minimalist-light-redesign-and-process-overhaul` y presentación del informe al usuario.
