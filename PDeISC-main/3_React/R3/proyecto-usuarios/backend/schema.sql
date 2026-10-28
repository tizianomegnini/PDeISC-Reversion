-- Ejecutar una sola vez en MySQL (por consola, Workbench o phpMyAdmin)
-- para crear la base y la tabla antes de arrancar el servidor.

CREATE DATABASE IF NOT EXISTS usuarios_app
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE usuarios_app;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
);
