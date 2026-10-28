-- TecnoFix - esquema MySQL 8 (utf8mb4).
-- Lo ejecuta `npm run db:init` (que ademas crea la base si no existe).
-- Tambien se puede correr a mano:  mysql -u root -p tecnofix < database/schema.sql

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS configuracion (
  clave VARCHAR(60) NOT NULL PRIMARY KEY,
  valor VARCHAR(255) NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO configuracion (clave, valor) VALUES ('limite_consultas_default', '20');

CREATE TABLE IF NOT EXISTS locales (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  direccion VARCHAR(200) NOT NULL,
  ciudad VARCHAR(100) NOT NULL,
  telefono VARCHAR(40) NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_locales_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  rol ENUM('cliente','tecnico','admin') NOT NULL,
  nombre VARCHAR(80) NOT NULL,
  apellido VARCHAR(80) NOT NULL,
  email VARCHAR(190) NOT NULL,
  telefono VARCHAR(40) NULL,
  password_hash VARCHAR(100) NOT NULL,
  proveedor_social VARCHAR(20) NULL,       -- proveedor de login social (Google/Facebook/GitHub)
  proveedor_social_id VARCHAR(190) NULL,   -- reservado
  activo TINYINT(1) NOT NULL DEFAULT 1,
  debe_cambiar_password TINYINT(1) NOT NULL DEFAULT 0,
  deleted_at DATETIME NULL,                -- eliminacion logica
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_usuarios_email (email),
  KEY idx_usuarios_rol (rol),
  KEY idx_usuarios_social (proveedor_social, proveedor_social_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS oauth_mobile_codes (
  code_hash CHAR(64) NOT NULL PRIMARY KEY,
  usuario_id INT UNSIGNED NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_oauth_mobile_codes_expiry (expires_at),
  CONSTRAINT fk_oauth_mobile_codes_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tecnicos (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT UNSIGNED NOT NULL,
  local_id INT UNSIGNED NOT NULL,
  especialidad VARCHAR(120) NULL,
  limite_consultas INT UNSIGNED NOT NULL DEFAULT 20,
  habilitado TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_tecnicos_usuario (usuario_id),
  KEY idx_tecnicos_local (local_id),
  CONSTRAINT fk_tecnicos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  CONSTRAINT fk_tecnicos_local FOREIGN KEY (local_id) REFERENCES locales(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Estados que CONSUMEN cupo del tecnico: asignada, en_proceso, esperando_cliente.
-- pendiente (sin tecnico), finalizada y cancelada NO consumen cupo.
CREATE TABLE IF NOT EXISTS consultas (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT UNSIGNED NOT NULL,
  tecnico_id INT UNSIGNED NULL,
  tipo_equipo VARCHAR(60) NOT NULL,
  marca VARCHAR(60) NOT NULL,
  modelo VARCHAR(80) NOT NULL,
  descripcion TEXT NOT NULL,
  estado ENUM('pendiente','asignada','en_proceso','esperando_cliente','finalizada','cancelada') NOT NULL DEFAULT 'pendiente',
  asignada_at DATETIME NULL,
  finalizada_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_consultas_cliente (cliente_id),
  KEY idx_consultas_tecnico_estado (tecnico_id, estado),
  KEY idx_consultas_estado (estado),
  CONSTRAINT fk_consultas_cliente FOREIGN KEY (cliente_id) REFERENCES usuarios(id),
  CONSTRAINT fk_consultas_tecnico FOREIGN KEY (tecnico_id) REFERENCES tecnicos(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mensajes (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  consulta_id INT UNSIGNED NOT NULL,
  autor_id INT UNSIGNED NOT NULL,
  contenido TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_mensajes_consulta (consulta_id, created_at),
  CONSTRAINT fk_mensajes_consulta FOREIGN KEY (consulta_id) REFERENCES consultas(id),
  CONSTRAINT fk_mensajes_autor FOREIGN KEY (autor_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- UNIQUE(consulta_id): una consulta se califica una sola vez, garantizado por la base.
CREATE TABLE IF NOT EXISTS valoraciones (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  consulta_id INT UNSIGNED NOT NULL,
  cliente_id INT UNSIGNED NOT NULL,
  tecnico_id INT UNSIGNED NOT NULL,
  estrellas TINYINT UNSIGNED NOT NULL,
  comentario VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_valoraciones_consulta (consulta_id),
  KEY idx_valoraciones_tecnico (tecnico_id),
  CONSTRAINT chk_estrellas CHECK (estrellas BETWEEN 1 AND 5),
  CONSTRAINT fk_val_consulta FOREIGN KEY (consulta_id) REFERENCES consultas(id),
  CONSTRAINT fk_val_cliente FOREIGN KEY (cliente_id) REFERENCES usuarios(id),
  CONSTRAINT fk_val_tecnico FOREIGN KEY (tecnico_id) REFERENCES tecnicos(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS auditoria (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT UNSIGNED NULL,
  accion VARCHAR(60) NOT NULL,
  entidad VARCHAR(40) NOT NULL,
  entidad_id INT UNSIGNED NULL,
  detalle JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_auditoria_entidad (entidad, entidad_id),
  KEY idx_auditoria_fecha (created_at),
  CONSTRAINT fk_auditoria_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sesiones: JWT sin estado (cookie httpOnly o header Bearer); no hace falta tabla de refresh tokens en esta etapa.
