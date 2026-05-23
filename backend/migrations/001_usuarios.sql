-- Tabla de usuarios para autenticación del backend.
-- Usuario de prueba: admin@cartera.com / admin123

CREATE SCHEMA IF NOT EXISTS cartera;

CREATE TABLE IF NOT EXISTS cartera.usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'gestor' CHECK (role IN ('admin', 'gestor', 'consulta')),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO cartera.usuarios (nombre, email, password_hash, role)
VALUES (
  'Administrador',
  'admin@cartera.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lihO',
  'admin'
) ON CONFLICT (email) DO NOTHING;
