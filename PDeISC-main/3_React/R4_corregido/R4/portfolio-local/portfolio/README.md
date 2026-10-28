# Portfolio React + Vercel + Railway

Aplicación React/Vite con una API serverless en Vercel. La API guarda el contenido del portfolio en MySQL alojado en Railway. El navegador solo llama a `/api`; las credenciales de Railway y del administrador quedan en el servidor.

## Variables de entorno

Configuralas en **Vercel → Project → Settings → Environment Variables** para Production, Preview y Development según corresponda:

| Variable | Valor |
| --- | --- |
| `MYSQL_PUBLIC_URL` | URL MySQL del TCP Proxy público de Railway, con usuario, contraseña, host, puerto y base. |
| `ADMIN_EMAIL` | Email de administrador. |
| `ADMIN_PASSWORD_HASH` | Hash bcrypt de la contraseña del administrador. |
| `JWT_SECRET` | Secreto aleatorio largo para firmar sesiones. |
| `MYSQL_SSL` | Opcional. Usar `true` solo si Railway/proveedor exige TLS. |

En Railway, abrí el servicio MySQL, habilitá **Public Networking / TCP Proxy** y copiá los datos públicos de conexión. La URL privada con host `*.railway.internal` funciona entre servicios de Railway, pero Vercel no puede alcanzarla. No uses la URL privada como `MYSQL_PUBLIC_URL`.

El proyecto crea automáticamente la tabla `portfolio_content` en el primer acceso. Revisá que el usuario MySQL tenga permisos para crear tablas y leer/escribir en la base configurada.

## Contraseña del administrador

Desde esta carpeta, ejecutá `npm run hash-password` y seguí la indicación para generar el hash bcrypt. Pegá el resultado en `ADMIN_PASSWORD_HASH`; la contraseña en texto plano no se guarda en el proyecto. Generá además un valor aleatorio largo para `JWT_SECRET`.

## Despliegue en Vercel

Configurá como **Root Directory** la carpeta `3_React/R4_corregido/R4/portfolio-local/portfolio` (o importá esa carpeta como raíz del proyecto). Vercel debe ejecutar `npm run build` y publicar `dist`. Después de agregar o cambiar variables, hacé un nuevo deployment.

Probá la conexión abriendo `/api/health` en el dominio del deployment. Una respuesta `{ "ok": true, "database": "MySQL", "connected": true }` confirma la conexión. Si falla, el log de Functions de Vercel contiene el detalle del error; no publiques la URL de conexión ni su contraseña.

## Desarrollo local

1. Copiá `.env.example` a `.env.local` y completá las mismas variables. Usá el endpoint TCP público de Railway si probás desde tu computadora.
2. Instalá dependencias con `npm install`.
3. Ejecutá `npx vercel dev` para levantar el frontend y las funciones `/api` juntas.

`npm run dev` inicia Vite solamente; para probar la API y la base localmente, usá `vercel dev`.

## Contenido inicial y edición

Si la tabla todavía no tiene el documento `main`, el sitio muestra los datos de `src/data/seed.json`. Ingresá al modo de edición con la contraseña configurada y usá el panel **Datos → Importar archivo** para guardar el contenido inicial en Railway. Las lecturas son públicas y las escrituras requieren un token administrador firmado por la API.
