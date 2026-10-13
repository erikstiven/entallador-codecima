-- ==============================================================================
-- CimaTex PostgreSQL Initialization Script
-- Ejecutado automáticamente por el contenedor Docker en /docker-entrypoint-initdb.d
-- ==============================================================================

-- Configuración de zona horaria y codificación
SET client_encoding = 'UTF8';
SET timezone = 'UTC';

-- 1. Extensiones criptográficas
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Disparador de auditoría temporal
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Tabla users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_id VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    plan VARCHAR(50) NOT NULL DEFAULT 'free',
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan);

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. Tabla orders_sync
CREATE TABLE IF NOT EXISTS orders_sync (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_code VARCHAR(100),
    client_name VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_sync_user_id ON orders_sync(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_sync_order_code ON orders_sync(order_code);
CREATE INDEX IF NOT EXISTS idx_orders_sync_client_name ON orders_sync(client_name);
CREATE INDEX IF NOT EXISTS idx_orders_sync_status ON orders_sync(status);
CREATE INDEX IF NOT EXISTS idx_orders_sync_created_at ON orders_sync(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_sync_data_gin ON orders_sync USING gin (data);

DROP TRIGGER IF EXISTS trg_orders_sync_updated_at ON orders_sync;
CREATE TRIGGER trg_orders_sync_updated_at
    BEFORE UPDATE ON orders_sync
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
