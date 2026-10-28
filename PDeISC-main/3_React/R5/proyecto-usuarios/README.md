# Sistema de usuarios — Backend + 2 versiones de Frontend

## Estructura

```
proyecto-usuarios/
├── backend/             API (Node + Express + SQLite)
├── frontend-router/     Front con React Router
└── frontend-usestate/   Front con useState (navegación sin router)
```

Como Correr:

Para correr:
npm run dev 

terminal 1:
cd proyecto-usuarios/backend

terminal 2:
cd proyecto-usuarios\frontend-router  

terminal 3:
cd proyecto-usuarios\frontend-usestate

## 1) Backend (MySQL)

Necesitás MySQL corriendo en tu máquina (o accesible en red): server local,
XAMPP/WAMP, Docker, etc.

Primero creá la base y la tabla, ejecutando `backend/schema.sql` en tu
cliente de MySQL (consola, MySQL Workbench, phpMyAdmin...):

```sql
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
```

Después:

```
cd backend
npm install
cp .env.example .env
```

Editá `.env` con tus datos reales de conexión:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password_mysql
DB_NAME=usuarios_app
```

Y arrancá:

```
npm run dev
```

Queda en http://localhost:4000. El backend usa un pool de conexiones
(`mysql2/promise`) contra la tabla `usuarios` que creaste con el script.

Endpoints:
- POST /api/auth/register — { nombre, email, password }
- POST /api/auth/login — { email, password }
- GET  /api/auth/me — protegida, requiere header Authorization: Bearer <token>
- PUT  /api/auth/me — protegida, actualiza { nombre }

## 2) Frontend con React Router

```
cd frontend-router
npm install
npm run dev
```

Abre en http://localhost:5173. Rutas: /login, /register, /dashboard, /perfil.
Las dos últimas están protegidas con <PrivateRoute>.

## 3) Frontend con useState

```
cd frontend-usestate
npm install
npm run dev
```

También en un puerto de Vite (5173 o el siguiente libre si ya usaste el
router). Acá no hay URLs reales: App.jsx guarda en un estado `vista` cuál
componente mostrar, y las mismas reglas de protección se aplican a mano.

## Persistencia y protección de datos, en las dos versiones

- El backend nunca guarda la contraseña en texto plano (bcrypt).
- Al loguearse, el backend devuelve un JWT. El front lo guarda en
  `localStorage` y lo manda en cada request con Axios (interceptor en
  `src/api/axios.js`).
- Al recargar la página, `AuthContext` (useEffect) lee el token guardado y
  pide `/api/auth/me` para restaurar la sesión sin pedir login de nuevo.
- Las rutas /dashboard y /perfil (o sus vistas equivalentes) están protegidas:
  sin token válido no se puede entrar.
- El logout borra el token de localStorage y limpia el estado del usuario.

## Notas para correr los tres procesos juntos

Necesitás 3 terminales abiertas: una para el backend, y una para cada front
(no los corras a la vez con el mismo puerto). El backend tiene CORS abierto
para desarrollo; en producción conviene restringirlo al dominio real del
front.

Como corerrlo?
