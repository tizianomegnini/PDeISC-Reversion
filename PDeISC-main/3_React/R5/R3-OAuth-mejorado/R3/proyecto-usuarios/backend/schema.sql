CREATE DATABASE IF NOT EXISTS usuarios_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE usuarios_app;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) NULL UNIQUE,
  password_hash VARCHAR(255) NULL,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS identidades_oauth (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  proveedor VARCHAR(40) NOT NULL,
  proveedor_id VARCHAR(255) NOT NULL,
  email_proveedor VARCHAR(150) NULL,
  nombre_proveedor VARCHAR(100) NULL,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_proveedor_usuario (proveedor, proveedor_id),
  UNIQUE KEY uq_usuario_proveedor (usuario_id, proveedor),
  CONSTRAINT fk_identidad_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
