#!/usr/bin/env bash
# ==============================================================================
# CimaTex - Script de Despliegue Automatizado para VPS Hostinger (CodeCima)
# Ubicación destino en servidor: /opt/cimatex
# Análogo a la infraestructura de despliegue de Cimafact
# ==============================================================================

set -euo pipefail

# Colores para salida informativa
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

APP_DIR="/opt/cimatex"
COMPOSE_FILE="docker-compose.prod.yml"

echo -e "${BLUE}==============================================================================${NC}"
echo -e "${BLUE}🚀 INICIANDO DESPLIEGUE DE CIMATEX (CodeCima VPS)${NC}"
echo -e "${BLUE}==============================================================================${NC}"

# 1. Asegurar directorio de trabajo
if [ ! -d "$APP_DIR" ]; then
    echo -e "${YELLOW}📁 Creando directorio base en $APP_DIR...${NC}"
    mkdir -p "$APP_DIR"
fi

cd "$APP_DIR"

# 2. Verificar existencia de archivo de variables de entorno
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️ No se encontró .env en $APP_DIR.${NC}"
    if [ -f ".env.example" ]; then
        echo -e "${YELLOW}📋 Creando .env a partir de .env.example...${NC}"
        cp .env.example .env
        echo -e "${RED}⚠️ ATENCIÓN: Por favor edite /opt/cimatex/.env con credenciales seguras de producción.${NC}"
    else
        echo -e "${RED}❌ ERROR: No se encontró .env ni .env.example.${NC}"
        exit 1
    fi
fi

# 3. Actualizar repositorio Git
if [ -d ".git" ]; then
    echo -e "${BLUE}📥 Actualizando repositorio Git desde rama main...${NC}"
    git fetch origin main
    git reset --hard origin/main
else
    echo -e "${YELLOW}ℹ️ No es un repositorio git activo, saltando git pull...${NC}"
fi

# 4. Descargar imágenes base actualizadas
echo -e "${BLUE}📦 Descargando imágenes base de Docker...${NC}"
docker compose -f "$COMPOSE_FILE" pull cimatex_postgres || true

# 5. Compilar imágenes de producción (API y Frontend Nginx)
echo -e "${BLUE}🔨 Compilando contenedores de producción...${NC}"
docker compose -f "$COMPOSE_FILE" build --pull

# 6. Levantar servicios en segundo plano con reemplazo seguro
echo -e "${BLUE}🔄 Levantando contenedores con Docker Compose...${NC}"
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

# 7. Esperar a que la base de datos y la API alcancen estado saludable
echo -e "${BLUE}⏳ Verificando salud de los servicios...${NC}"
RETRIES=15
WAIT_SECS=3
HEALTH_OK=false

for i in $(seq 1 $RETRIES); do
    API_STATUS=$(docker inspect --format='{{json .State.Health.Status}}' cimatex_api 2>/dev/null || echo '"unknown"')
    DB_STATUS=$(docker inspect --format='{{json .State.Health.Status}}' cimatex_postgres 2>/dev/null || echo '"unknown"')
    
    echo -e "   Intento $i/$RETRIES -> PostgreSQL: $DB_STATUS | API: $API_STATUS"
    
    if [ "$API_STATUS" == '"healthy"' ] && [ "$DB_STATUS" == '"healthy"' ]; then
        HEALTH_OK=true
        break
    fi
    sleep $WAIT_SECS
done

if [ "$HEALTH_OK" = true ]; then
    echo -e "${GREEN}✅ Todos los servicios están saludables y operativos.${NC}"
else
    echo -e "${YELLOW}⚠️ Aviso: Los servicios están iniciando o el healthcheck aún no reporta 'healthy'.${NC}"
    echo -e "${YELLOW}Mostrando logs recientes de cimatex_api:${NC}"
    docker compose -f "$COMPOSE_FILE" logs --tail=30 cimatex_api
fi

# 8. Limpiar imágenes huérfanas y caché de compilación previa
echo -e "${BLUE}🧹 Limpiando imágenes y capas obsoletas...${NC}"
docker image prune -f

# 9. Mostrar resumen final
echo -e "\n${GREEN}==============================================================================${NC}"
echo -e "${GREEN}🎉 DESPLIEGUE DE CIMATEX COMPLETADO CON ÉXITO${NC}"
echo -e "${GREEN}==============================================================================${NC}"
docker compose -f "$COMPOSE_FILE" ps

echo -e "\n${BLUE}🌐 Puntos de Acceso:${NC}"
echo -e "   • Frontend Web:      http://<IP_VPS>:${WEB_PORT:-8080}"
echo -e "   • API Healthcheck:   http://<IP_VPS>:${API_PORT:-4000}/api/health"
echo -e "   • PostgreSQL Port:   localhost:${POSTGRES_PORT:-5433}"
echo -e "==============================================================================\n"
