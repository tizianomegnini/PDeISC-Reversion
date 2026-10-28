# TecnoFix — versión inicial local y funcional

Soporte técnico con tres roles (cliente, técnico, administrador), asignación automática de consultas, mensajes y valoraciones.
Al crear una consulta, el cliente puede dejar sin completar tipo, marca y modelo; luego puede conversar con el técnico desde el detalle de la consulta una vez asignada.
En desarrollo local, el sitio usa React (Vite), Express y MySQL. Para la publicación web se puede usar Vercel/Railway; la app Android Expo está en `mobile/`.

La app Android Expo/React Native está en [`mobile/`](./mobile/). Para probar con Expo Go o generar un APK mediante EAS, seguí las instrucciones de [`mobile/README.md`](./mobile/README.md).

| Parte | Dirección |
|---|---|
| Frontend React | http://localhost:5173 |
| Backend Express | http://localhost:3000 |
| API | http://localhost:3000/api/v1 |
| MySQL | servicio local (puerto 3306 por defecto) |

## 1. Requisitos (Windows)

1. **Node.js 20.10 o superior** (recomendado 22 LTS): https://nodejs.org — verifique con `node -v`.
2. **MySQL Community Server 8.x** (o superior): https://dev.mysql.com/downloads/installer/ — durante la instalación anote la contraseña de `root`. Verifique que el servicio esté iniciado (`services.msc` → *MySQL80* → En ejecución).
3. **Visual Studio Code** y, opcionalmente, Git.

## 2. Instalación (paso a paso)

Abra la carpeta del proyecto en VS Code y use la terminal integrada (**Terminal → Nuevo terminal**, PowerShell o CMD).

```powershell
# 1) Dependencias
cd backend
npm install
copy .env.example .env

cd ..\frontend
npm install
copy .env.example .env
```

### Configurar `backend\.env`

Abra `backend\.env` y complete **como mínimo**:

```
DB_USER=root
DB_PASSWORD=la_contraseña_de_root_de_MySQL
JWT_SECRET=<un valor largo y aleatorio>
```

Para generar `JWT_SECRET`:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

> Opcional y más prolijo: en lugar de `root`, cree un usuario propio en MySQL
> (`mysql -u root -p`) y úselo en `.env`:
> ```sql
> CREATE USER 'tecnofix'@'localhost' IDENTIFIED BY 'una_clave_segura';
> GRANT ALL PRIVILEGES ON tecnofix.* TO 'tecnofix'@'localhost';
> GRANT ALL PRIVILEGES ON tecnofix_test.* TO 'tecnofix'@'localhost';
> GRANT CREATE, DROP ON *.* TO 'tecnofix'@'localhost';
> ```

### Crear la base, las tablas y los datos de prueba

```powershell
cd backend
npm run db:init     # crea la base "tecnofix" (utf8mb4) y todas las tablas desde database\schema.sql
npm run db:seed     # 3 locales, 15 técnicos (5 por local), 1 admin y 1 cliente demo
```

El seed **genera contraseñas aleatorias** y las guarda en `backend\seed-credentials.local.txt` (archivo ignorado por Git).
Si prefiere fijarlas, defina en `.env` `ADMIN_EMAIL`, `ADMIN_PASSWORD` y/o `SEED_USER_PASSWORD` antes de correr el seed.
Los usuarios con contraseña generada **deben cambiarla en su primer ingreso**: hasta entonces la API les bloquea todo lo demás.

Para empezar de cero: `npm run db:reset` (borra y recrea la base) y luego `npm run db:seed`.
Para crear solo un administrador: `npm run create-admin`.

## 3. Iniciar la aplicación (dos terminales)

**Terminal 1 — backend**
```powershell
cd backend
npm run dev
```
Debe mostrar `API TecnoFix escuchando en http://localhost:3000/api/v1`.

**Terminal 2 — frontend**
```powershell
cd frontend
npm run dev
```
Abra http://localhost:5173 e ingrese con las credenciales de `backend\seed-credentials.local.txt`
(administrador: `admin@tecnofix.local`; técnicos: `tecnico1@tecnofix.local` … `tecnico15@tecnofix.local`; cliente demo: `cliente@tecnofix.local`).
Los clientes nuevos se registran desde la pantalla *Registrarse*.

## 4. Configurar el inicio de sesión con Google en producción

1. En Google Cloud Console, configurá la pantalla de consentimiento OAuth y creá un cliente OAuth de tipo **Aplicación web**.
   Si la aplicación queda en modo de prueba, agregá las cuentas que la van a probar como usuarios de prueba.
2. Agregá como URI de redirección autorizada la URL del callback del backend, exactamente:
   `https://pdeisc-production-182f.up.railway.app/api/v1/auth/social/google/callback`
   Si Railway muestra otro dominio público para el backend, usá ese dominio en su lugar.
3. En las variables del servicio **backend** de Railway, configurá:
   ```
   GOOGLE_CLIENT_ID=<ID del cliente OAuth>
   GOOGLE_CLIENT_SECRET=<secreto del cliente OAuth>
   GOOGLE_REDIRECT_URI=https://pdeisc-production-182f.up.railway.app/api/v1/auth/social/google/callback
   FRONTEND_URL=https://p-de-isc-reversion.vercel.app
   CORS_ORIGINS=https://p-de-isc-reversion.vercel.app
   NODE_ENV=production
   COOKIE_SAMESITE=none
   COOKIE_SECURE=true
   ```
   No subas el secreto a Git ni lo pongas en Vercel. Railway debe reiniciar el backend después de guardar estas variables.
4. En Vercel, `VITE_API_URL` debe apuntar al backend y terminar en `/api/v1`; luego hacé un nuevo deploy del frontend.

El callback requiere una cuenta de Google con correo verificado. Si ese correo ya existe en TecnoFix y no está vinculado a otro proveedor, se vincula a Google; si es nuevo, se crea una cuenta de cliente.

## 5. Configurar el inicio de sesión con Facebook en producción

1. En Meta for Developers, creá/configurá la app y agregá el producto **Facebook Login** para web. En los ajustes de Facebook Login, activá OAuth de cliente web y agregá como URI de redireccionamiento OAuth válida:
   `https://pdeisc-production-182f.up.railway.app/api/v1/auth/social/facebook/callback`
2. En los ajustes básicos de la app, configurá el dominio de la app como `p-de-isc-reversion.vercel.app`. La URL del sitio debe ser `https://p-de-isc-reversion.vercel.app`.
3. En las variables del servicio **backend** de Railway, configurá:
   ```
   FACEBOOK_APP_ID=<ID de la app de Meta>
   FACEBOOK_APP_SECRET=<secreto de la app de Meta>
   FACEBOOK_REDIRECT_URI=https://pdeisc-production-182f.up.railway.app/api/v1/auth/social/facebook/callback
   FRONTEND_URL=https://p-de-isc-reversion.vercel.app
   ```
   No subas el secreto a Git ni lo pongas en Vercel. Si la app está en modo desarrollo, iniciá sesión con una cuenta que tenga rol de administrador, desarrollador o tester de esa app.
4. Después de guardar las variables, esperá a que Railway reinicie el backend. Vercel ya dirige el botón de Facebook al backend actualizado; si el frontend no está desplegado con ese cambio, publicá también el último commit de Vercel.

Facebook debe devolver un correo para crear la cuenta. Si ya existe una cuenta con ese email, el inicio de sesión se rechaza en lugar de vincularla automáticamente; ingresá con el método habitual de esa cuenta. Las cuentas nuevas se crean con rol de cliente.

## 6. Configurar el inicio de sesión con GitHub en producción

1. En GitHub, abrí **Settings → Developer settings → OAuth Apps → New OAuth App** (o seleccioná una OAuth App existente).
2. Configurá **Homepage URL** como `https://p-de-isc-reversion.vercel.app` y **Authorization callback URL** con esta URL exacta:
   `https://pdeisc-production-182f.up.railway.app/api/v1/auth/social/github/callback`
3. Generá un client secret y configurá en el servicio **backend** de Railway:
   ```
   GITHUB_CLIENT_ID=<Client ID de la OAuth App>
   GITHUB_CLIENT_SECRET=<Client secret de la OAuth App>
   GITHUB_REDIRECT_URI=https://pdeisc-production-182f.up.railway.app/api/v1/auth/social/github/callback
   FRONTEND_URL=https://p-de-isc-reversion.vercel.app
   ```
   No subas el secreto a Git ni lo pongas en Vercel. Railway debe reiniciar el backend después de guardar estas variables.
4. El flujo solicita `read:user` y `user:email` para obtener el perfil y un correo principal verificado. Si GitHub no devuelve un correo principal verificado, agregá y verificá un email en la cuenta de GitHub e intentá otra vez.

Si el correo verificado ya corresponde a una cuenta sin proveedor social vinculado, se vincula a GitHub. Si ya está asociado a otro proveedor, el acceso se rechaza sin vincular automáticamente. Las cuentas nuevas se crean como clientes.

## 7. Pruebas automatizadas

Con MySQL en ejecución:

```powershell
cd backend
npm test
```

Usan una base **separada** (`tecnofix_test`, configurable con `DB_NAME_TEST`) que se borra y recrea en cada corrida; el código se niega a borrar cualquier base cuyo nombre no termine en `_test`.
Cubren: registro/login/JWT/cookies, cambio de contraseña obligatorio, permisos por rol y aislamiento entre técnicos y clientes, prioridad de asignación, técnicos nuevos, límites, cola de pendientes y reintentos, liberación de cupo, **concurrencia (12 altas simultáneas sin superar los límites)**, transiciones de estado, mensajes y valoraciones (una sola por consulta, incluso en paralelo).

## 8. Verificación manual sugerida

1. Registre un cliente → cree una consulta → debe verla **asignada** con técnico y local.
2. Ingrese como ese técnico (cambie su contraseña inicial) → *Comenzar atención*, escriba un mensaje, *Finalizar*.
3. Como cliente: lea el mensaje, califique con estrellas (un segundo intento se rechaza).
4. Como administrador: cree/edite/desactive/elimine técnicos, cree locales, cambie un límite a 1 y cree 2 consultas → la segunda queda en *Pendientes*; finalice la primera y la pendiente se asigna sola.
5. Reinicie backend, frontend y la PC: los datos siguen en MySQL.

## 9. Decisiones técnicas (documentadas porque faltaba información)

- **JavaScript** en todo el proyecto (no TypeScript), para simplificar la primera etapa.
- **`bcryptjs`** en lugar de `bcrypt`: es bcrypt en JavaScript puro (mismo algoritmo y formato de hash) y evita compilar módulos nativos en Windows.
- **Sesión**: JWT (8 h) en **cookie httpOnly**; el JavaScript del navegador nunca lo toca (no hay `localStorage`). Para apps móviles la misma API acepta `Authorization: Bearer` y devuelve el token si se envía `X-Client: mobile`. Las peticiones con cookie que modifican datos exigen `X-Requested-With` (defensa CSRF). En cada llamada se vuelve a leer el usuario en MySQL: si se desactiva o elimina, su token deja de servir.
- **No hay tabla de refresh tokens**: se usa JWT sin estado (el requisito lo marcaba como opcional).
- **Estados de una consulta**: `pendiente → asignada → en_proceso ⇄ esperando_cliente → finalizada`, y `cancelada` (la pide el cliente). **Consumen cupo**: `asignada`, `en_proceso`, `esperando_cliente`. No consumen: `pendiente`, `finalizada`, `cancelada`.
- **Asignación**: en una transacción se bloquean (`SELECT … FOR UPDATE`) los técnicos candidatos en orden de id; así dos altas simultáneas se serializan y nunca superan el límite. Orden: 1) menor puntaje de valoración, 2) menos consultas activas, 3) menor id.
  Puntaje = promedio bayesiano `(suma de estrellas + 4×5) / (cantidad + 5)`: un técnico sin valoraciones parte de **4.0**. El orden ascendente favorece primero a técnicos con menor puntaje para que puedan recibir consultas y sumar valoraciones.
  Candidatos: técnico habilitado, usuario activo y no eliminado, local activo.
- Al **finalizar o cancelar**, al **subir un límite**, **crear/rehabilitar un técnico** o reintentar manualmente, se intentan asignar las pendientes automáticamente (las más antiguas primero).
- **Desactivar/eliminar un técnico** devuelve sus consultas activas a *pendiente* para reasignarlas. La eliminación es lógica (`deleted_at`): se conserva todo el historial.
- **Eliminar un local** = desactivarlo (tiene técnicos y consultas asociados).
- **Login social**: Google, Facebook y GitHub usan OAuth con validación de `state`; sus credenciales se configuran mediante variables de entorno y las cuentas se guardan como clientes.
- Contraseñas: mínimo 8 caracteres con al menos una letra y un número.
- El administrador puede restablecer la contraseña de un técnico desde **Técnicos → Editar → Restablecer contraseña**. La nueva clave es provisoria y el técnico debe cambiarla al iniciar sesión.

## 10. Estructura

```
backend/
  database/schema.sql      tablas, claves foráneas, índices (MySQL 8, utf8mb4)
  scripts/                 init-db, seed, create-admin
  src/config  src/middleware  src/routes  src/services  src/utils
  tests/                   pruebas automatizadas (node:test + supertest, MySQL real)
frontend/
  src/services/api.js      único punto de acceso a la API
  src/context              Auth y notificaciones (Context API)
  src/components  src/pages  src/styles/global.css
docs/API.md                endpoints
docs/FUTURO.md             Vercel, Railway, Expo / APK
```

## 11. Problemas frecuentes

| Síntoma | Solución |
|---|---|
| `No se pudo conectar a MySQL` | Inicie el servicio *MySQL80*; revise `DB_*` en `backend\.env`. |
| `Falta la variable de entorno JWT_SECRET` | Complete `JWT_SECRET` en `backend\.env`. |
| `Access denied for user` | Contraseña/usuario incorrectos en `.env`. |
| El frontend dice “No se pudo conectar con el servidor” | El backend no está corriendo, o `VITE_API_URL` (`frontend\.env`) no coincide con su puerto. |
| Error de CORS | En local, `CORS_ORIGINS` debe incluir `http://localhost:5173`. En Railway, incluya el origen exacto del frontend Vercel en `CORS_ORIGINS` (sin `/` al final). Para cookies entre Vercel y Railway, configure `COOKIE_SAMESITE=none` y `COOKIE_SECURE=true`. |
| Puerto 3000/5173 ocupado | Cambie `PORT` (y `VITE_API_URL`) o cierre el proceso que lo usa. |
