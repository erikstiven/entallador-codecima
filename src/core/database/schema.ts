/**
 * HMB Entallador — SQLite Schema DDL & Initial Migrations
 */

export const INITIAL_SCHEMA_SQL = `
-- Configuración de perfiles de producción y anchos de bobina
CREATE TABLE IF NOT EXISTS production_profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    total_roll_width_mm REAL NOT NULL DEFAULT 1220.0,
    left_margin_mm REAL NOT NULL DEFAULT 50.0,
    right_margin_mm REAL NOT NULL DEFAULT 50.0,
    printable_width_mm REAL NOT NULL DEFAULT 1120.0,
    piece_spacing_mm REAL NOT NULL DEFAULT 7.0,
    top_margin_mm REAL NOT NULL DEFAULT 10.0,
    bottom_margin_mm REAL NOT NULL DEFAULT 10.0,
    is_default INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Biblioteca de moldes vectoriales
CREATE TABLE IF NOT EXISTS pattern_sets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    garment_type TEXT NOT NULL, -- FUTBOL, BASKET, etc.
    description TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Tallas asociadas a un conjunto de moldes
CREATE TABLE IF NOT EXISTS pattern_sizes (
    id TEXT PRIMARY KEY,
    pattern_set_id TEXT NOT NULL,
    size_name TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY(pattern_set_id) REFERENCES pattern_sets(id) ON DELETE CASCADE
);

-- Piezas vectoriales por talla
CREATE TABLE IF NOT EXISTS pattern_pieces (
    id TEXT PRIMARY KEY,
    size_id TEXT NOT NULL,
    piece_type TEXT NOT NULL,
    piece_name TEXT NOT NULL,
    cut_polygon_json TEXT NOT NULL,
    svg_raw_content TEXT NOT NULL,
    bbox_width_mm REAL NOT NULL,
    bbox_height_mm REAL NOT NULL,
    area_mm2 REAL NOT NULL,
    allowed_rotations_json TEXT NOT NULL DEFAULT '[0]',
    label_anchor_x REAL,
    label_anchor_y REAL,
    placeholders_json TEXT DEFAULT '[]',
    FOREIGN KEY(size_id) REFERENCES pattern_sizes(id) ON DELETE CASCADE
);

-- Biblioteca de diseños maestros
CREATE TABLE IF NOT EXISTS designs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sport TEXT NOT NULL DEFAULT 'FUTBOL',
    preview_thumbnail TEXT,
    design_files_json TEXT NOT NULL DEFAULT '{}',
    default_rules_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Proyectos
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    client_name TEXT,
    team_name TEXT,
    design_id TEXT,
    pattern_set_id TEXT,
    production_profile_id TEXT,
    status TEXT NOT NULL DEFAULT 'DRAFT',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(design_id) REFERENCES designs(id),
    FOREIGN KEY(pattern_set_id) REFERENCES pattern_sets(id),
    FOREIGN KEY(production_profile_id) REFERENCES production_profiles(id)
);

-- Ítems del pedido (jugadores del Excel)
CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    row_number INTEGER NOT NULL,
    player_name TEXT NOT NULL,
    player_number TEXT NOT NULL,
    size_name TEXT NOT NULL,
    garment_type TEXT NOT NULL DEFAULT 'COMPLETO',
    gender TEXT,
    notes TEXT,
    is_valid INTEGER NOT NULL DEFAULT 1,
    validation_errors TEXT,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Sesión de Nesting
CREATE TABLE IF NOT EXISTS nesting_sessions (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    mode TEXT NOT NULL DEFAULT 'MAX_SAVINGS',
    roll_width_mm REAL NOT NULL,
    total_length_mm REAL NOT NULL,
    total_pieces INTEGER NOT NULL,
    utilization_percent REAL NOT NULL,
    waste_percent REAL NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Posición de cada pieza en el rollo
CREATE TABLE IF NOT EXISTS nesting_items (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    order_item_id TEXT NOT NULL,
    piece_id TEXT NOT NULL,
    pos_x_mm REAL NOT NULL,
    pos_y_mm REAL NOT NULL,
    rotation_deg REAL NOT NULL DEFAULT 0.0,
    is_locked INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY(session_id) REFERENCES nesting_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY(order_item_id) REFERENCES order_items(id),
    FOREIGN KEY(piece_id) REFERENCES pattern_pieces(id)
);

-- Historial de exportaciones
CREATE TABLE IF NOT EXISTS export_history (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    export_format TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size_bytes INTEGER,
    roll_width_mm REAL,
    roll_length_mm REAL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id)
);

-- Ajustes globales
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Inserción de perfiles predeterminados si no existen
INSERT OR IGNORE INTO production_profiles (
    id, name, total_roll_width_mm, left_margin_mm, right_margin_mm, 
    printable_width_mm, piece_spacing_mm, top_margin_mm, bottom_margin_mm, is_default
) VALUES 
('profile_epson_122', 'Epson 122cm (Área Útil 112cm)', 1220.0, 50.0, 50.0, 1120.0, 7.0, 10.0, 10.0, 1),
('profile_epson_160', 'Epson 160cm (Área Útil 150cm)', 1600.0, 50.0, 50.0, 1500.0, 7.0, 10.0, 10.0, 0),
('profile_epson_110', 'Epson 110cm (Área Útil 100cm)', 1100.0, 50.0, 50.0, 1000.0, 7.0, 10.0, 10.0, 0);
`;
