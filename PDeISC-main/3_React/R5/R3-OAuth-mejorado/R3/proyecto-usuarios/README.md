# Sistema de usuarios — Backend + 2 versiones de Frontend

```
proyecto-usuarios/
├── backend/             API (Node + Express + MySQL)
├── frontend-router/     Front con React Router      → http://localhost:5173
└── frontend-usestate/   Front con useState (sin router) → http://localhost:5174
```

## Requisitos

- **Node.js 18.18 o superior** (recomendado 20 o 22 LTS). Comprobalo con `node -v`.
- **MySQL** (5.7+/8+) o MariaDB **encendido**: servicio MySQL, XAMPP/WAMP, Docker, etc.

## Puesta en marcha

**1. Configurar el backend.** Copiá el archivo de ejemplo y editalo:

```bash
cd backend
cp .env.example .env        # en Windows (cmd): copy .env.example .env
```

En `backend/.env` completá como mínimo:

- `DB_PASSWORD` → la contraseña de **tu** MySQL (vacía si tu `root` no tiene, típico de XAMPP).
- `JWT_SECRET` → un secreto propio. Generalo con:
  `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

**2. Instalar todo** (desde la carpeta `proyecto-usuarios`, no desde `backend`):

```bash
npm run install:all
```

**3. Arrancar los tres procesos a la vez:**

```bash
npm run dev
```

Esto levanta la API en `:4000`, el front con router en `:5173` y el front con
useState en `:5174`. Cada uno sale con un color distinto en la consola.
También podés arrancarlos por separado: `npm run dev:api`, `npm run dev:router`,
`npm run dev:usestate`.

> **La base y la tabla se crean solas** cuando arranca el backend
> (`CREATE DATABASE/TABLE IF NOT EXISTS`). `backend/schema.sql` queda por si
> preferís crearlas a mano.

Si todo salió bien, en la consola del backend vas a ver:

```
✅ Base de datos lista
✅ API escuchando en http://localhost:4000
```

## Endpoints

| Método | Ruta | Protegida | Cuerpo |
|---|---|---|---|
| POST | `/api/auth/register` | no | `{ nombre, email, password }` |
| POST | `/api/auth/login` | no | `{ email, password }` |
| GET | `/api/auth/me` | sí | — |
| PUT | `/api/auth/me` | sí | `{ nombre }` |
| GET | `/api/health` | no | — |

Las rutas protegidas requieren el header `Authorization: Bearer <token>`.

Reglas de validación (las aplica el backend y, para dar feedback inmediato, también los formularios):
nombre de 1 a 100 caracteres (sin contar espacios sobrantes), email con formato válido
(se guarda en minúsculas), contraseña de 6 a 72 caracteres.

## Cómo funciona la sesión (igual en las dos versiones)

- El backend nunca guarda la contraseña en texto plano (bcrypt).
- Al loguearse devuelve un JWT (dura 2 h por defecto, `JWT_EXPIRES_IN`). El front lo guarda
  en `localStorage` y lo manda en cada request con Axios (`src/api/axios.js`).
- Al recargar la página, `AuthContext` lee el token y pide `/api/auth/me` para restaurar la
  sesión. Si el token ya no sirve (401) se borra; si el backend simplemente no responde,
  **el token se conserva** y se avisa en pantalla.
- Si el token vence con la app abierta, el interceptor de Axios lo detecta (401) y la app
  cierra la sesión mostrando "Tu sesión expiró".
- `/dashboard` y `/perfil` (o sus vistas equivalentes) exigen sesión. `/login` y `/register`
  redirigen al panel si ya estás logueado.

## Solución de problemas

**Al arrancar el backend** (el mensaje ya dice qué pasa; esto es la explicación ampliada):

| Mensaje | Causa | Qué hacer |
|---|---|---|
| `MySQL rechazó al usuario "root"` | `DB_USER`/`DB_PASSWORD` incorrectos en `.env` | Poné la contraseña real de tu MySQL. Ojo: si `DB_PASSWORD` está vacío y tu MySQL sí tiene contraseña, falla acá. |
| `No se pudo conectar a MySQL en localhost:3306` | MySQL apagado o en otro puerto | Encendelo (servicio / XAMPP / Docker) o corregí `DB_HOST`/`DB_PORT`. |
| `Falta JWT_SECRET` | No existe `backend/.env` | Hacé `cp .env.example .env` (ver paso 1). |
| `El puerto 4000 ya está en uso` | Ya hay un backend corriendo | Cerralo, o cambiá `PORT` en `.env` (y `VITE_API_URL` en los fronts). |

**En el navegador:**

| Síntoma | Causa | Qué hacer |
|---|---|---|
| "No se pudo conectar con el servidor" | El backend no está corriendo o falló al arrancar | Mirá la consola del backend: ahí está el motivo. |
| Error de CORS en la consola del navegador | El front corre en un puerto distinto de 5173/5174 | Agregá su origen a `CORS_ORIGIN` en `backend/.env` y reiniciá el backend. |
| `Port 5173 is already in use` | Ya hay otro front abierto en ese puerto | Cerralo. Los puertos son fijos a propósito (el CORS del backend depende de ellos). |
| `Cannot find module @rollup/rollup-...` o `You installed esbuild for another platform` | Se copiaron `node_modules` de otro sistema operativo | Borrá `node_modules` y corré `npm run install:all`. **Nunca compartas `node_modules`**, se reinstalan solos. |
| "Tu sesión expiró" | El token duró más que `JWT_EXPIRES_IN` | Es lo esperado: iniciá sesión de nuevo. |

## Antes de pasar a producción

- Poné un `JWT_SECRET` largo y aleatorio (con `NODE_ENV=production` el backend se niega a arrancar con uno débil).
- Restringí CORS con `CORS_ORIGIN=https://tu-dominio.com`.
- Servilo detrás de HTTPS.
- Pendiente (no incluido): límite de intentos de login (rate limiting), por ejemplo con `express-rate-limit`.
