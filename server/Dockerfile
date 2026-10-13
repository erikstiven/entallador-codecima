# ==============================================================================
# CimaTex API Dockerfile (Multi-stage Node.js 20 Alpine)
# ==============================================================================

# --- Etapa 1: Compilación de TypeScript ---
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependencias del build
COPY package*.json ./
RUN npm install

# Copiar configuración y código fuente
COPY tsconfig.json ./
COPY src/ ./src/
COPY db/ ./db/

# Compilar TypeScript a JavaScript (dist/)
RUN npm run build

# --- Etapa 2: Entorno de Ejecución Ligero y Seguro ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000
ENV HOST=0.0.0.0

# Instalar herramientas para healthcheck
RUN apk add --no-cache curl

# Copiar manifiestos e instalar solo dependencias de producción
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copiar artefactos compilados y esquemas SQL desde el builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/db ./db

# Asignar permisos al usuario sin privilegios 'node'
RUN chown -R node:node /app
USER node

EXPOSE 4000

# Verificación de salud periódica en Docker
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:4000/api/health || exit 1

CMD ["node", "dist/server.js"]
