# Feature: Auditoría Completa de Diseño, Estandarización de Tokens, Modales, Botones y Toasts

- **Feature Name:** `ui-design-system-and-modal-audit`
- **Repository Locator:** `odd/tasks/ui-design-system-and-modal-audit.md`
- **Engram Topic Key:** `odd/ui-design-system-and-modal-audit/tasks`
- **Base Branch / Commit:** `feat/minimalist-light-redesign-and-process-overhaul` (`29d4846`)
- **Delivery Strategy:** `ask-on-risk` (Forecast: ~900 authored lines across 4 comprehensive audit tasks)
- **TDD Mode:** Functional checks enabled (`npm test` via `vitest run` & `npm run build` via `tsc && vite build`)
- **RDD Status:** Disabled / Unmanaged (`unavailable` in environment; strict functional and visual verification enforced)

---

## Objective, Problem & Why

- **Problem:**
  1. **Incoherencia de Radios de Borde (Exceso de redondez):** La interfaz mezcla arbitrariamente botones con `rounded-2xl`, `rounded-3xl` y `rounded-full`, generando un aspecto tosco, inflado y poco profesional (tipo "burbuja"), en lugar de la estética sobria, compacta y profesional del referente industrial (Sublimifyer / SaaS moderno con `rounded-lg` de 8px y `rounded-md` de 6px).
  2. **Colores sin Estandarizar:** Coexisten verdes oscuros arbitrarios, púrpuras neón sobresaturados, cianes y naranjas sin jerarquía visual unificada. Además, existe un hack en `globals.css` que invierte `text-white` y sobreescribe clases de Tailwind generando inconsistencias en botones.
  3. **Modales y Toasts de SweetAlert2 Obsoletos:** El modal de confirmación (`showAlert.confirm`) renderiza un cuadro redondeado tosco con un círculo gigante naranja de signo de exclamación y botones flotantes desproporcionados. Los toasts tienen bordes y sombras discordantes.
  4. **Vistas Clave Saturadas:** En `NewOrderView` la zona de arrastre es excesivamente violeta y la barra inferior combina botones y alertas con bordes circulares dispares; en `PatternsView` los botones de exportación tienen colores desalineados ("Descargar Plantilla Illustrator" en verde bosque, "Script JSX" en morado oscuro).
- **Why:**
  Estandarizar integralmente el sistema de diseño visual (Design System) de CimaTex bajo una estética moderna, minimalista, centralizada y pulida, con modales profesionales tipo Radix/Tailwind UI, toasts sutiles y elegantes, y una jerarquía de botones y colores limpia y coherente.

---

## Authorized Scope & Constraints

- **Authorized Scope:**
  1. **Core de Diseño y Alertas (`globals.css` y `alerts.ts`):** Eliminar hacks que deforman colores en `globals.css`. Rediseñar SweetAlert2 y Toast para tener modales y toasts modernos, con insignias de icono compactas (40px `rounded-lg`), títulos limpios, botones estandarizados en `rounded-lg` y sombras suaves.
  2. **Shell UI & Navegación (`Sidebar.tsx`, `Header.tsx`):** Reemplazar los botones activos en cápsula inflada (`rounded-2xl`) por un estado activo profesional (`rounded-lg`, fondo sutil con borde o acento limpio).
  3. **Vistas de Pedidos y Moldes (`NewOrderView.tsx`, `PatternsView.tsx`):** Rediseñar la zona de carga de Excel con tonos neutros sutiles, armonizar la barra de acciones inferior, y unificar botones de exportación y selectores de tallas a `rounded-lg`.
  4. **Inspección, Diseños y Nesting (`DesignsView.tsx`, `GarmentInspectionTab.tsx`, `ProductionNestingView.tsx`):** Armonizar todos los botones, controles de calibración y barras de herramientas a la escala estándar de radios y colores.
- **Constraints:**
  - Preservar al 100% la funcionalidad lógica de cada módulo y la integridad del motor de nesting Clipper2.
  - 100% de pruebas pasando (`npm test`) y cero errores en `npm run build`.

---

## Actionable Checklist

- [ ] **TASK-1: Re-arquitectura del Sistema de Modales, Toasts y Depuración de Tokens en `globals.css`**
  - **ID:** `TASK-1`
  - **Route:** Delegated Direct (Writer trigger: touches `src/core/ui/alerts.ts`, `src/styles/globals.css`).
  - **Scope:** Limpiar en `globals.css` las sobreescrituras forzadas de `text-white` que desconfiguran botones. Rediseñar `showAlert` (confirmaciones, éxito, error, info) y `Toast` para que luzcan como modales modernos (estilo Tailwind UI/Radix) con tarjetas compactas, icono elegante en caja de 40px, botones `rounded-lg` y paleta neutra con acento violeta institucional.
  - **Acceptance Criteria:**
    - Los diálogos de confirmación (`¿Eliminar este molde?`, `¿Limpiar pedido?`) se ven limpios, modernos y proporcionales.
    - Los toasts son flotantes, sutiles y con tipografía legible.
    - No hay efectos secundarios de texto negro sobre botones oscuros.
  - **Checks:** `npm test` + verificación visual en dev server.
  - **Evidence / Commit:** TBD

- [ ] **TASK-2: Armonización de la Barra Lateral (Sidebar) y Cabecera (Header)**
  - **ID:** `TASK-2`
  - **Route:** Delegated Direct (Writer trigger: touches `src/components/Sidebar.tsx`, `src/components/Header.tsx`, `src/views/WorkshopApp.tsx`).
  - **Scope:** Retirar la cápsula inflada `rounded-2xl` del item activo del sidebar y sustituirla por un diseño moderno (`rounded-lg` con padding armónico). Ajustar el toggle de colapso, el header de usuario y los botones superiores a `rounded-lg`.
  - **Acceptance Criteria:**
    - La navegación lateral es sobria, profesional y sin formas infladas tipo globo.
    - El encabezado mantiene proporción y coherencia visual con la barra lateral.
  - **Checks:** `npm test` + build check.
  - **Evidence / Commit:** TBD

- [ ] **TASK-3: Estandarización de Pedidos y Moldes (`NewOrderView.tsx` & `PatternsView.tsx`)**
  - **ID:** `TASK-3`
  - **Route:** Delegated Direct (Writer trigger: touches `src/views/NewOrderView.tsx`, `src/views/PatternsView.tsx`).
  - **Scope:** En `NewOrderView`, reemplazar la zona de dropzone hiper-saturada de violeta por un área neutral limpia (`border-slate-300 hover:border-violet-400 bg-slate-50/50 rounded-xl`). Armonizar la barra de CTA inferior eliminando badges inflados `rounded-full` y unificando botones en `rounded-lg`. En `PatternsView`, unificar los botones "Descargar Plantilla Illustrator" y "Script JSX" a la jerarquía de botones de la app, y estandarizar las píldoras de tallas y tarjetas de piezas a `rounded-lg`.
  - **Acceptance Criteria:**
    - La vista de pedidos luce despejada, clara y equilibrada.
    - La vista de moldes no presenta botones verdes o morados fuera de norma.
    - Todos los radios de bordes son coherentes (`rounded-lg` / `rounded-xl`).
  - **Checks:** `npm test` + build check.
  - **Evidence / Commit:** TBD

- [ ] **TASK-4: Auditoría y Ajuste de Diseños, Inspección y Nesting (`DesignsView`, `GarmentInspectionTab`, `ProductionNestingView`)**
  - **ID:** `TASK-4`
  - **Route:** Delegated Direct (Writer trigger: touches `src/views/DesignsView.tsx`, `src/views/GarmentInspectionTab.tsx`, `src/views/ProductionNestingView.tsx`).
  - **Scope:** Revisar y estandarizar botones, modales secundarios (dorsales, exportación), controles de calibración y barras de herramientas de inspección y bobina. Asegurar que ningún botón conserve `rounded-2xl` o `rounded-3xl` y que la paleta responda a los tokens estándar.
  - **Acceptance Criteria:**
    - Todas las vistas del flujo de producción comparten la misma guía de estilos.
    - Cero elementos con radios desproporcionados o colores disonantes.
    - Suite de 37 archivos de prueba pasando y build 100% limpio.
  - **Checks:** `npm test` (37 suites) + `npm run build`.
  - **Evidence / Commit:** TBD

---

## Progress, Verification Evidence & Next Step

- **Current Status:** Iniciando TASK-1 de la auditoría completa de diseño.
- **Verification Evidence:** Pendiente de ejecución.
- **Next Step:** Ejecutar `TASK-1` en `src/styles/globals.css` y `src/core/ui/alerts.ts`.
