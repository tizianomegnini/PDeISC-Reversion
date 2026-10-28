# Cambios realizados en R3

## Autenticación

- Se mantuvo el registro y login por email + contraseña.
- Se agregó una capa de identidades OAuth vinculada al usuario.
- Se agregó Google como proveedor obligatorio del diseño.
- Se agregaron GitHub, Facebook/Meta, Discord y Spotify.
- El frontend consulta qué proveedores están configurados y deshabilita los que todavía no tienen credenciales.

## Backend

Archivos principales:

- `backend/oauth.js`: flujo OAuth, `state`, PKCE, callbacks, intercambio de código e identidad del proveedor.
- `backend/routes/auth.js`: endpoints `/auth/oauth/*`.
- `backend/db.js`: tabla `identidades_oauth` y compatibilidad para cuentas OAuth sin contraseña.
- `backend/.env.example`: todas las variables necesarias.

## Frontend React Router

- `frontend-router/src/components/SocialLogin.jsx`
- `frontend-router/src/pages/OAuthCallback.jsx`
- Login y registro muestran los proveedores.
- Nueva ruta `/oauth/callback`.

## Frontend useState

- `frontend-usestate/src/components/SocialLogin.jsx`
- `frontend-usestate/src/components/OAuthCallback.jsx`
- Login y registro muestran los proveedores.

## Seguridad

El frontend no recibe directamente el access token del proveedor. El backend lo intercambia, obtiene la identidad y crea un código temporal de un solo uso; el frontend canjea ese código por el JWT propio de la API.

## Importante

No se copiaron credenciales OAuth reales del proyecto original. `backend/.env` incluido en esta versión tiene un JWT local nuevo y las credenciales OAuth vacías. Completá Google primero y después los demás proveedores que quieras habilitar.
