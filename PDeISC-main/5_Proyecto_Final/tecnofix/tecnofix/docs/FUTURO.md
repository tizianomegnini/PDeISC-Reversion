# Preparación para el futuro (no hace falta nada de esto para usar la versión local)

El frontend solo habla con la API (`frontend/src/services/api.js`) y toda la lógica de negocio vive en el backend, así que cada paso es de configuración.

## MySQL en Railway
1. Cree un servicio MySQL en Railway y copie host, puerto, usuario, contraseña y nombre.
2. Cargue el esquema: `DB_HOST=… DB_PORT=… DB_USER=… DB_PASSWORD=… DB_NAME=… npm run db:init` (desde `backend`).
3. Cree el administrador: `ADMIN_EMAIL`/`ADMIN_PASSWORD` + `npm run create-admin`. No use `db:seed` con datos de prueba en producción.

## API (Express)
Se puede alojar en Railway (servicio Node, *root directory* `backend`, comando `npm start`). Variables: `NODE_ENV=production`, `PORT` (lo da Railway), `DB_*`, `JWT_SECRET` (nuevo y largo), `CORS_ORIGINS=https://p-de-isc-6uxr.vercel.app`.
Si web y API quedan en dominios distintos: `COOKIE_SAMESITE=none` y `COOKIE_SECURE=true` (requiere HTTPS), para que el navegador acepte la cookie de sesión entre Vercel y Railway. El origen actual de Vercel está incluido en la lista permitida del backend; al cambiar el dominio del frontend, actualice `CORS_ORIGINS` en Railway. Ya hay `helmet` y límite de intentos en login/registro; detrás de un proxy agregue `app.set('trust proxy', 1)`.

## Web en Vercel
Proyecto con *root directory* `frontend`, framework Vite, `npm run build`, salida `dist`. Variable `VITE_API_URL=https://su-api.up.railway.app/api/v1`. Para rutas de React Router agregue un `vercel.json` con una reescritura a `/index.html`.

## App móvil (React Native + Expo Go → APK)
- Reutilice la API sin duplicar lógica: mismas rutas, enviando `X-Client: mobile` en login/registro para recibir el token y luego `Authorization: Bearer <token>` (guárdelo con `expo-secure-store`).
- Copie `src/services/api.js` como base cambiando `credentials`/cookies por el header Bearer.
- En Expo Go use la IP de su PC en la red (no `localhost`) y agréguela a `CORS_ORIGINS` si hace falta.
- APK: `eas build -p android --profile preview`.

## Login social
Complete las variables `GOOGLE_*`, `FACEBOOK_*`, `APPLE_*` e implemente el intercambio de código en `backend/src/routes/auth.js` (`/auth/social/:proveedor`); la tabla `usuarios` ya tiene `proveedor_social` y `proveedor_social_id`.
