# 🧵 CimaTex — Entallador y Nesting Textil 1:1

> **Plataforma Industrial de Entallado, Graduación Textil y Nesting Continuo para Talleres de Sublimación Deportiva.**  
> Desarrollado por **[Codecima](https://codecima.com)** · Machala, Ecuador.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React 18](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-192%20Tests%20Passing-6E9F18?style=flat&logo=vitest&logoColor=white)](https://vitest.dev/)
[![Producción Activa](https://img.shields.io/badge/🌐_Web-cimatex.codecima.com-7c3aed?style=flat)](https://cimatex.codecima.com)

---

## 🌐 Entorno de Producción en Vivo

* **Plataforma Web & Landing:** 👉 **[https://cimatex.codecima.com](https://cimatex.codecima.com)**
* **API Central & Healthcheck:** 👉 **[https://cimatex.codecima.com/api/health](https://cimatex.codecima.com/api/health)**
* **Servidor de Producción:** VPS / Cloud Hostinger (`46.202.183.53:65002`)
* **Base de Datos Central:** MySQL `u836650900_cimatex` (Hostinger)

---

## 📋 ¿Qué se configuró recientemente en el proyecto? (Bitácora de Cambios)

Si acabas de hacer `git pull`, aquí tienes el resumen exacto de lo que se implementó y configuró:

1. **Rebranding Completo a CimaTex:**
   * Sustitución integral de la marca anterior por **CimaTex**.
   * Integración de logotipos oficiales (versión normal, horizontal, light, dark y favicon).
   * Incorporación de la mascota 3D de CimaTex optimizada en formato `.webp`.
   * Paleta visual unificada en tonos violeta/magenta corporativos de Codecima (`#7c3aed`, `#6d28d9`, `#5b21b6`).

2. **Landing Page y Demo Visual Limpia:**
   * Ocultadas las tarjetas de competidores y el video de camisetas genéricas.
   * Nuevo panel visual interactivo (`CimaTexAppMockV2.tsx`) enfocado exclusivamente en presentar los **6 módulos del sistema**:
     1. *Nuevo Pedido y Nómina (Excel / CSV)*
     2. *Diseñador Maestro 1:1 (Calibración vectorial)*
     3. *Moldes y Curvas de Graduación (SVG / DXF)*
     4. *Entallador y Bobina Continua (Nesting inteligente >90%)*
     5. *Historial y Reimpresiones puntuales*
     6. *Configuración de Taller & Plóter (Presets Epson / Roland / Mimaki)*
   * Sección de precios simplificada a **1 solo Plan Gratuito** ($0 USD / mes) con registro rápido.

3. **Autenticación con Google y Base de Datos Central:**
   * Configurada la **Google Auth Platform** oficial con Client ID:
     `278008919566-s87oe55k94v02n52aqa7h95c1e6togtj.apps.googleusercontent.com`
   * Base de datos creada en Hostinger: **`u836650900_cimatex`**.
   * Tablas creadas:
     * `cimatex_users`: Perfiles registrados con Google, roles y plan.
     * `cimatex_orders_sync`: Sincronización de pedidos y moldes en JSON.
     * `cimatex_sessions`: Tokens de sesión activa con vigencia de 30 días.
   * Endpoint de autenticación central: `POST /api/auth/google`.

4. **CI/CD Despliegue Automático con GitHub Actions:**
   * Archivo de flujo: [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml).
   * Cada `push` a la rama `main` compila, valida 192 pruebas automáticas y despliega por SCP/SSH a Hostinger.

---

## 🔄 ¿Qué pasa cuando haces `git pull`? (Guía para Desarrolladores)

Cuando ejecutas:
```bash
git pull origin main
```

1. **Descarga de código:** Recibes el frontend actualizado, los componentes de la landing, el cliente de Google Auth y los scripts del backend en `server/` y `public/api/`.
2. **Variables de entorno:** Asegúrate de tener tu archivo `.env` en la raíz (puedes copiarlo desde `.env.example`):
   ```env
   VITE_API_URL=https://cimatex.codecima.com/api
   VITE_GOOGLE_CLIENT_ID=278008919566-s87oe55k94v02n52aqa7h95c1e6togtj.apps.googleusercontent.com
   ```
3. **Instalación y ejecución local:**
   ```bash
   npm install
   npm run dev
   ```
   Abre [http://localhost:5173](http://localhost:5173).
4. **Aislamiento de datos en desarrollo:**
   * La aplicación local utiliza **IndexedDB con SQLite WebAssembly (`hmb_entallador_db`)**.
   * Tus pruebas locales de carga de Excel, moldes y nesting **no afectan la base de datos de producción ni se mezclan con los datos de otros compañeros**.
   * Si no tienes conexión a internet o no configuras la API, el sistema activa automáticamente un **fallback simulado** para que puedas seguir programando sin interrupciones.

---

## 🚀 ¿Qué pasa cuando haces `git push origin main`? (Despliegue Automático)

Cuando subes tus cambios:
```bash
git add .
git commit -m "feat: mi nueva funcionalidad"
git push origin main
```

Se dispara automáticamente el **Pipeline de GitHub Actions**:

```
[ Git Push a main ]
        ↓
1. Clonar repositorio en Ubuntu Runner
        ↓
2. Instalar dependencias (npm ci)
        ↓
3. Ejecutar suite de pruebas (Vitest - 192 tests)
        ↓
4. Compilar bundle de producción web (npm run build:web)
        ↓
5. Transferir archivos compilados por SCP seguro al servidor Hostinger
   Ruta destino: /home/u836650900/domains/codecima.com/public_html/cimatex/
        ↓
6. Ajustar permisos a 755
        ↓
🎉 ¡Web en vivo actualizada en https://cimatex.codecima.com en < 60 segundos!
```

> **Nota:** Para que el despliegue automático funcione desde tu cuenta de GitHub, el repositorio debe tener configurado el secreto `HOSTINGER_PASSWORD` en **Settings $\rightarrow$ Secrets and variables $\rightarrow$ Actions**.

---

## 🛠️ Comandos Frecuentes

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor de desarrollo local en Vite (`http://localhost:5173`) |
| `npm test` | Ejecuta la suite de pruebas con Vitest (192 pruebas automáticas) |
| `npm run test:watch` | Ejecuta pruebas en modo observador interactivo |
| `npm run build:web` | Compila el bundle web SPA para producción en `dist/` |
| `npm run build` | Compila tanto la versión web como los procesos de escritorio Electron |
| `npm run typecheck` | Verifica los tipos de TypeScript sin emitir archivos |

---

## 🗄️ Estructura del Proyecto

```text
entallador-codecima/
├── .github/workflows/
│   └── deploy.yml              # CI/CD: Despliegue automático a Hostinger
├── public/
│   ├── api/
│   │   ├── index.php           # API Core en producción (PHP 8.2 + PDO MySQL)
│   │   └── .htaccess           # Enrutamiento de /api/*
│   ├── cimatex-logo.webp       # Logotipos oficiales CimaTex
│   ├── cimatex-mascota.webp    # Mascota oficial en 3D
│   └── clipper2z.wasm          # Motor de geometría poligonal WASM
├── server/
│   ├── db/
│   │   ├── schema_mysql.sql    # Esquema SQL para MariaDB/MySQL en Hostinger
│   │   └── schema.sql          # Esquema SQL para PostgreSQL
│   ├── src/                    # Backend modular TypeScript alternativo
│   └── Dockerfile              # Contenedor Docker para despliegue en VPS
├── src/
│   ├── core/
│   │   ├── database/           # SQLite local en cliente (sql.js + IndexedDB)
│   │   ├── geometry/           # Envoltura de Clipper2 para offsets y cortes
│   │   └── nesting/            # Motor de acomodo inteligente (bin-packing)
│   ├── landing/
│   │   ├── auth/               # Store Zustand de autenticación con Google y API
│   │   ├── components/         # Secciones de la landing y modales
│   │   └── LandingApp.tsx      # Contenedor maestro de la landing
│   └── views/                  # Vistas del taller (Pedidos, Diseños, Moldes, Bobina)
├── .env.example                # Plantilla de variables de entorno
└── package.json
```

---

## 👥 Equipo y Soporte

* **Desarrollo:** [Codecima Tech Team](https://codecima.com)
* **Contacto:** ventas@codecima.com / WhatsApp: 0995921171
* **Ubicación:** Machala - El Oro, Ecuador.
