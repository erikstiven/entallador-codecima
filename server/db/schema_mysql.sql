-- ==============================================================================
-- CimaTex Database Schema (MySQL 8 / MariaDB 10.x - Hostinger Compatible)
-- ==============================================================================

-- 1. Tabla de Usuarios (Google OAuth + Plan + Taller)
CREATE TABLE IF NOT EXISTS `cimatex_users` (
  `id` VARCHAR(36) NOT NULL,
  `google_id` VARCHAR(191) NULL,
  `email` VARCHAR(191) NOT NULL,
  `full_name` VARCHAR(191) NULL,
  `avatar_url` TEXT NULL,
  `plan` VARCHAR(50) NOT NULL DEFAULT 'free',
  `role` VARCHAR(50) NOT NULL DEFAULT 'user',
  `workshop_name` VARCHAR(191) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_cimatex_users_email` (`email`),
  KEY `idx_cimatex_users_google_id` (`google_id`),
  KEY `idx_cimatex_users_plan` (`plan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabla de Órdenes y Proyectos de Nesting Sincronizados
CREATE TABLE IF NOT EXISTS `cimatex_orders_sync` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `order_code` VARCHAR(100) NULL,
  `client_name` VARCHAR(191) NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'draft',
  `data` LONGTEXT NOT NULL, -- JSON con nómina, moldes, piezas y cálculo de bobina
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cimatex_orders_user_id` (`user_id`),
  KEY `idx_cimatex_orders_order_code` (`order_code`),
  KEY `idx_cimatex_orders_status` (`status`),
  KEY `idx_cimatex_orders_created_at` (`created_at`),
  CONSTRAINT `fk_cimatex_orders_user` FOREIGN KEY (`user_id`) 
    REFERENCES `cimatex_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabla de Sesiones Activas y Tokens
CREATE TABLE IF NOT EXISTS `cimatex_sessions` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `token_hash` VARCHAR(255) NOT NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` TEXT NULL,
  `expires_at` DATETIME NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cimatex_sessions_user_id` (`user_id`),
  KEY `idx_cimatex_sessions_token_hash` (`token_hash`),
  CONSTRAINT `fk_cimatex_sessions_user` FOREIGN KEY (`user_id`) 
    REFERENCES `cimatex_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
