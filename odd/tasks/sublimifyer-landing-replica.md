# Feature: Réplica 1:1 de Landing Page Sublimifyer y Separación Arquitectónica (`src/landing/` vs `WorkshopApp`)

- **Feature Name:** `sublimifyer-landing-replica`
- **Repository Locator:** `odd/tasks/sublimifyer-landing-replica.md`
- **Engram Topic Key:** `odd/sublimifyer-landing-replica/tasks`
- **Base Branch / Commit:** `main` (`2393fd2`) -> `feat/sublimifyer-landing-replica`
- **Delivery Strategy:** `ask-on-risk` (Forecast: ~1,600 authored lines across 5 cohesive tasks; static assets & third-party mock HTML excluded from authored count)
- **TDD Mode:** Functional checks enabled (`npm test` via `vitest run` & `npm run build` via `tsc && vite build`; source: existing project configuration in `package.json` and prior ODD task documents)
- **RDD Status:** CLI `gentle-ai` not installed in environment (`unavailable`); functional checks (`npm test`, `npm run build`, and live browser verification) enforced on every task.

---

## Objective, Problem & Why

- **Problem:** El repositorio actual (`entallador-codecima`) monta directamente el sistema de producción de taller (`Sidebar` + `Header` + inicialización SQLite/WASM + 6 vistas operativas) en `/` con estilos globales oscuros (`bg-slate-950`, `overflow-hidden`, `select-none`, overrides `html.light`). Se requiere incorporar una réplica 1:1 exacta de `https://sublimifyer.com/` (incluyendo todas sus secciones, animaciones, abanico físico de tarjetas, video, simulador interactivo `/app-mock.html`, selector de moneda ARS/USD, multi-idioma ES/EN/PT, botón de WhatsApp y las 11 subpáginas del footer) como página de inicio (`/` y `/landing`), manteniendo una separación arquitectónica limpia respecto al sistema actual (`/app`).
- **Why:** Tener primero una base 1:1 idéntica, limpia y bien estructurada en su propio módulo (`src/landing/`) permite desacoplar completamente la web comercial de la aplicación interna del taller (`WorkshopApp`) para luego personalizarla al negocio local sin contaminar estilos, estado ni carga de WASM/SQLite.

## Authorized Scope & Constraints

- **Authorized Scope:**
  1. Descargar y servir todos los assets originales de `sublimifyer.com` en `public/` (`subly-mark-teal.svg`, `subly-icon-teal.png`, 6 imágenes `.webp` del hero, video `/shirt-scroll/sublimifyer-scroll.mp4`, simulador interactivo `/app-mock.html` con sus 22 vistas y cursor guiado, y traducciones `/translations/en.json` y `/translations/pt.json`).
  2. Separar el sistema actual en `src/views/WorkshopApp.tsx` (accesible en `/app` o desde los botones CTA *"Iniciar Sesión"* / *"Comenzar"*) y crear la mini-app `src/landing/` como inicio en `/` y `/landing`.
  3. Aislar los estilos, variables CSS (`--primary: #00857a`, `--primary-dark: #00655d`, `--radius: 1rem`), scroll vertical y tipografía `Inter` de la landing page para que no colisionen con `globals.css` ni `themeStore.ts`.
  4. Implementar 1:1 todas las secciones de la landing page (`Header`, `Hero` + abanico físico de 10 tarjetas, `#soluciones`, `#beneficios`, `#demo`, `#pricing`, `#cta`, `Footer`, botón flotante WhatsApp) y las 11 subpáginas estáticas del footer.
  5. Verificar con tests automatizados (`vitest`) y build de producción (`npm run build`).
- **Constraints:** No alterar ni degradar ninguna funcionalidad existente del taller (`WorkshopApp`, anidado, moldes, exportación EPS/PDF, base de datos SQLite).

---

## Actionable Checklist

- [x] **TASK-1: Sincronización 1:1 de Assets Originales, Simulador `/app-mock.html`, Traducciones y Datos de Subpáginas**
  - **ID:** `TASK-1`
  - **Route:** Delegated Direct (`self` subagent `13e5d4fc-9893-4151-ad74-1c7a5deb10a4` — Preparation & Writer trigger: multiple asset files + data modules).
  - **Scope:** `public/subly-mark-teal.svg`, `public/subly-icon-teal.png`, `public/subly-mark-teal.png`, `public/placeholder.jpg`, `public/hero/*.webp`, `public/shirt-scroll/sublimifyer-scroll.mp4`, `public/app-mock.html`, `public/translations/{es,en,pt}.json`, `src/landing/i18n/es.ts`, `src/landing/i18n/translations.ts`, `src/landing/data/subpagesData.ts`, `src/landing/landingAssetsAndData.test.ts`.
  - **Acceptance Criteria:** Todos los archivos multimedia originales, el simulador `/app-mock.html`, los JSON de traducción (`en`, `pt`, `es`) y el contenido íntegro de las 11 subpáginas existen localmente y cargan sin errores.
  - **Checks:** `npx vitest run src/landing/landingAssetsAndData.test.ts` (3/3 passed) + `npm run build` (0 errors).
  - **Evidence / Commit:** Commit `b59eb40` (`feat(landing): sync original sublimifyer assets, interactive app-mock, i18n and subpage data`).
  - **RDD Assessment:** `unavailable` (`gentle-ai` CLI not installed in PATH; verified via Vitest and production build).

- [x] **TASK-2: Separación Arquitectónica (`src/landing/` vs `WorkshopApp`), Router (`/` y `/landing` vs `/app`) y Aislamiento CSS/i18n**
  - **ID:** `TASK-2`
  - **Route:** Delegated Direct (`self` subagent `aedcac28-5f39-4252-a430-2514d9df7856` — Writer trigger: touches `src/App.tsx`, `src/views/WorkshopApp.tsx`, `src/landing/LandingApp.tsx`, `src/landing/styles/landing.css`, `src/landing/i18n/LanguageContext.tsx`, `src/landing/router/landingRouteStore.ts`, `index.html`, `tailwind.config.js`, `src/modules/settings/themeStore.ts`).
  - **Scope:** `src/App.tsx`, `src/views/WorkshopApp.tsx`, `src/components/Header.tsx`, `src/landing/LandingApp.tsx`, `src/landing/i18n/LanguageContext.tsx`, `src/landing/router/landingRouteStore.ts`, `src/landing/styles/landing.css`, `index.html`, `tailwind.config.js`, `src/modules/settings/themeStore.ts`, `src/landing/landingRoutingAndI18n.test.ts`.
  - **Acceptance Criteria:**
    - `/` y `/landing` (más las 11 rutas de subpáginas) renderizan `LandingApp` con scroll vertical natural, selección de texto habilitada, fuente `Inter` y variables CSS exactas de Sublimifyer sin activar `dbService.initialize()` ni verse afectados por `html.light`.
    - `/app` (o clic en acceso al sistema) monta `WorkshopApp` con su layout `h-screen overflow-hidden` intacto.
  - **Checks:** `npx vitest run src/landing/` (8/8 tests passed) y `npm run build` (0 errors).
  - **Evidence / Commit:** Commit `0f56ea1` (`feat(landing): separate landing mini-app from workshop app with routing and isolated tokens`).
  - **RDD Assessment:** `unavailable` (`gentle-ai` CLI not installed in PATH; verified via Vitest and production build).

- [x] **TASK-3: Implementación 1:1 de Header Sticky, Hero con Abanico Físico de 10 Tarjetas, `#soluciones`, `#beneficios` y `#demo` Interactivo**
  - **ID:** `TASK-3`
  - **Route:** Delegated Direct (`self` subagent `0ded70a4-93e0-424b-9067-38f72852fcf5` — Writer trigger: multiple non-trivial UI components in `src/landing/components/`).
  - **Scope:** `src/landing/components/LandingHeader.tsx`, `src/landing/components/HeroSection.tsx`, `src/landing/components/HeroCardMarquee.tsx`, `src/landing/components/SolutionsSection.tsx`, `src/landing/components/BenefitsSection.tsx`, `src/landing/components/DemoSection.tsx`, `src/landing/LandingApp.tsx`, `src/landing/landingSectionsTask3.test.ts`.
  - **Acceptance Criteria:**
    - Header sticky con sombra al hacer scroll, links centrados (`#soluciones`, `#beneficios`, `#demo`, `#pricing`), selector de idioma `ES/EN/PT`, botones `Iniciar Sesión` y `Comenzar`, y drawer mobile.
    - Hero con fondo de puntos `14x14px`, onda SVG inferior y abanico de 10 tarjetas (6 imágenes WebP + 4 tarjetas UI DOM: Pedido `#1042`, Seguimiento 5 pasos, Consumo barras 7 días, Producción dona SVG) con desplazamiento vinculado al scroll, drag táctil con inercia y rotación dinámica izquierda/derecha + hover `+4deg`.
    - Video `#soluciones` a `playbackRate = 1.5`, tarjeta `#beneficios` (`#06423e` + `#5fd9c8`) con 4 ítems y badges, y ventana macOS `#demo` con semáforo, badge `EN VIVO` e `<iframe>` `/app-mock.html#designer` activado por `IntersectionObserver` (`postMessage("sbm:play", "*")`).
  - **Checks:** `npx vitest run src/landing/` (13/13 tests passed) y `npm run build` (0 errors).
  - **Evidence / Commit:** Commit `c7881ce` (`feat(landing): implement 1:1 header, physics hero marquee, video showcase, benefits and interactive demo`).
  - **RDD Assessment:** `unavailable` (`gentle-ai` CLI not installed in PATH; verified via Vitest and production build).

- [x] **TASK-4: Implementación 1:1 del Bloque Unificado (`#pricing` con Degradado 24 Paradas y Toggle ARS/USD, `#cta`, `Footer`, WhatsApp Flotante) y las 11 Subpáginas**
  - **ID:** `TASK-4`
  - **Route:** Delegated Direct (`self` subagent `1269e609-197f-4540-900d-8f35b51fd139` — Writer trigger: multiple components & subpage views in `src/landing/`).
  - **Scope:** `src/landing/components/PricingSection.tsx`, `src/landing/components/CtaSection.tsx`, `src/landing/components/LandingFooter.tsx`, `src/landing/components/WhatsAppFloatingButton.tsx`, `src/landing/pages/SubpageView.tsx`, `src/landing/LandingApp.tsx`, `src/landing/router/landingRouteStore.ts`, `src/landing/landingTask4.test.ts`.
  - **Acceptance Criteria:**
    - `#pricing` con superposición `-mt-11`, degradado de 24 paradas hacia `#06423e`, 2 filas de 3 píldoras con hover `#00655d`, toggle `Pesos (ARS)` / `Dólares (USD)` con detección de zona horaria y persistencia en `localStorage`, 3 planes (`Inicial`, `Profesional`, `Empresarial`), callout `ShieldCheck` y link WhatsApp.
    - `#cta` con degradado hacia `#020c0c`, `Footer` de 4 columnas con links funcionales a las 11 subpáginas (`/documentation`, `/guides`, `/blog`, `/casos-de-uso`, `/glosario`, `/support`, `/about`, `/careers`, `/privacy-policy`, `/terms-of-service`, `/cookie-policy`), y botón flotante de WhatsApp con aparición a los `2000ms`, anillo pulsante y tooltip.
  - **Checks:** `npx vitest run src/landing/` (20/20 tests passed) y `npm run build` (0 errors).
  - **Evidence / Commit:** Commit `644f9c3` (`feat(landing): implement 1:1 pricing, cta, footer, whatsapp button and 11 subpages`).
  - **RDD Assessment:** `unavailable` (`gentle-ai` CLI not installed in PATH; verified via Vitest and production build).

- [x] **TASK-5: Suite de Pruebas de la Landing (`tests/landing/`) y Verificación Visual 1:1 en Navegador**
  - **ID:** `TASK-5`
  - **Route:** Delegated Direct (`self` subagent `36fafddd-03ab-41cf-b7ad-88092475b3f7` — integration test suite & full build verification).
  - **Scope:** `tests/landing/landingReplica.test.ts`, `src/landing/LandingApp.tsx`, `src/landing/i18n/LanguageContext.tsx`, `src/landing/components/HeroCardMarquee.tsx`, `src/landing/components/SolutionsSection.tsx`, `vite.config.ts`.
  - **Acceptance Criteria:** Tests unitarios/integración de rutas, traducciones, planes/monedas y subpáginas pasando al 100%, `npm run build` limpio, y verificación de fidelidad 1:1.
  - **Checks:** `npm test` (`35 passed | 1 skipped`, `186 passed | 2 skipped`, 0 failures) y `npm run build` (`tsc && vite build`, 0 errors).
  - **Evidence / Commit:** Commit `8aa2812` (`test(landing): add end-to-end integration test suite for 1:1 sublimifyer replica and routing`).
  - **RDD Assessment:** `unavailable` (`gentle-ai` CLI not installed in PATH; verified via full Vitest suite and production build).

---

## Progress & Verification Log

- **Current Status:** Completadas las 5 tareas (`TASK-1` a `TASK-5`) en la rama `feat/sublimifyer-landing-replica` (commits `b59eb40`, `0f56ea1`, `c7881ce`, `644f9c3`, `8aa2812`). Suite completa `npm test` (186 tests pasados, 0 fallos) y `npm run build` exitosos.
- **Next Step:** Lista la estructura 1:1 aislada en `src/landing/` para comenzar la personalización de marca y contenido del negocio local cuando el usuario lo indique.
