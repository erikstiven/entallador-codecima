# ==============================================================================
# CimaTex Web Frontend Dockerfile (Multi-stage Vite -> Nginx Alpine)
# ==============================================================================

# --- Etapa 1: Compilación de los activos estáticos Web ---
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependencias completas para compilación (tsc + vite)
COPY package*.json ./
RUN npm install

# Copiar el código fuente del proyecto
COPY . .

# Compilar la aplicación React en modo Web (excluyendo Electron)
RUN npm run build:web

# --- Etapa 2: Servidor Nginx de Alto Rendimiento ---
FROM nginx:1.27-alpine AS runner

# Eliminar configuración por defecto de Nginx
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copiar la configuración personalizada con soporte SPA y proxy reverso
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los artefactos estáticos generados por Vite
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# Verificación de salud periódica
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
