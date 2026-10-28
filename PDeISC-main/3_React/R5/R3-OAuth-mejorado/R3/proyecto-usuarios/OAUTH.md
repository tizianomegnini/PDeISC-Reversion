# Inicio de sesión con proveedores OAuth

El proyecto mantiene el login normal con email/contraseña y agrega OAuth sin reemplazarlo.

## Proveedores incluidos

- Google (obligatorio)
- GitHub
- Facebook / Meta
- Discord
- Spotify

Los botones aparecen automáticamente. Un proveedor queda habilitado cuando sus dos variables (`CLIENT_ID` y `CLIENT_SECRET`) están configuradas.

## 1. Configurar el backend

Copiá `backend/.env.example` a `backend/.env` y completá:

- `JWT_SECRET`
- datos de MySQL
- `FRONTEND_URL`
- credenciales de los proveedores que quieras activar

No subas `backend/.env` a GitHub.

## 2. Callback

En cada consola de desarrollador, la URL de callback debe coincidir exactamente con:

`http://localhost:4000/api/auth/oauth/PROVEEDOR/callback`

Ejemplos:

- Google: `/google/callback`
- GitHub: `/github/callback`
- Discord: `/discord/callback`
- Facebook: `/facebook/callback`

Spotify requiere una URI de loopback con IP explícita. En el panel de Spotify registrá:

`http://127.0.0.1:4000/api/auth/oauth/spotify/callback`

Y en `backend/.env` configurá la misma URL como `SPOTIFY_CALLBACK_URL`. Para Spotify no uses `localhost`; la URI registrada, la de autorización y la del intercambio de código tienen que ser idénticas.

Para una instalación publicada, reemplazá `localhost` por tu dominio HTTPS y cambiá `OAUTH_CALLBACK_BASE`.

## 3. Google

Google usa OAuth 2.0/OpenID Connect. En la consola de Google tenés que crear un cliente de tipo aplicación web y agregar exactamente la URI de redirección configurada en el backend.

## 3.1 Spotify

En el [Spotify Developer Dashboard](https://developer.spotify.com/dashboard), creá una app y copiá su Client ID y Client Secret en `SPOTIFY_CLIENT_ID` y `SPOTIFY_CLIENT_SECRET` dentro de `backend/.env`. Agregá allí la Redirect URI indicada arriba. El backend solicita `user-read-email` y `user-read-private` para obtener la identidad y el email disponibles del perfil.

## 4. Base de datos

El backend crea automáticamente:

- `usuarios`
- `identidades_oauth`

`identidades_oauth` permite que el mismo usuario tenga varias identidades externas, una por proveedor.

Las cuentas creadas exclusivamente por OAuth pueden no tener contraseña local. El login por email/contraseña existente sigue funcionando para las cuentas que sí tienen contraseña.

## 5. Seguridad implementada

- `state` aleatorio por intento OAuth.
- PKCE en proveedores que lo soportan en esta implementación.
- Código de intercambio de un solo uso entre backend y frontend.
- El token del proveedor nunca se guarda en `localStorage`.
- El JWT de tu API sigue siendo el único token que consume el frontend.
- Las identidades externas tienen una restricción única por proveedor + ID externo.

## 6. Arranque

Desde `R3/proyecto-usuarios`:

```bash
npm run install:all
npm run dev
```

O por separado:

```bash
npm run dev:api
npm run dev:router
```

El frontend principal con React Router usa `http://localhost:5173`.
