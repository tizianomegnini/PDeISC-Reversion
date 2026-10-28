# Qué se encontró y qué se cambió

Cada punto marcado con ✅ **se reprodujo** antes de arreglarlo (contra una base MySQL/MariaDB real
para el backend, y con tests de componentes para el frontend) y se **verificó** después.

## Las causas más probables de "errores" al usar el proyecto

| # | Problema | Efecto | Solución |
|---|---|---|---|
| 1 | ✅ El `.env` venía con `DB_PASSWORD=` vacío: si tu MySQL tiene contraseña, rechaza la conexión (reproducido con un MySQL con contraseña; en XAMPP con `root` sin contraseña andaría) | Todo daba "Error al registrar el usuario" y la causa real solo estaba en la consola del backend | Al arrancar se verifica la base y se imprime la causa concreta (contraseña, MySQL apagado, puerto…). Si falla, el backend se detiene con instrucciones. |
| 2 | ✅ `node_modules` venía en el zip con binarios de Windows (solo falla fuera de Windows) (`@esbuild/win32-x64`, `@rollup/rollup-win32-x64-*`) | En Mac/Linux/WSL: `Cannot find module @rollup/rollup-linux-x64-gnu` | Se quita `node_modules`, se agrega `.gitignore` y `npm run install:all`. |
| 3 | La base/tabla dependía de ejecutar `schema.sql` a mano | Si se olvidaba: `Unknown database` → 500 | El backend crea base y tabla al iniciar (idempotente). `schema.sql` se conserva. |
| 4 | ✅ Backend apagado → el front mostraba "Error al iniciar sesión" | Imposible saber que el problema era el backend | Mensaje específico: "No se pudo conectar con el servidor… (puerto 4000)". |
| 5 | README: decía "SQLite" (es MySQL) y el "Cómo correr" era ilegible | Confusión al arrancar | README reescrito + `npm run dev` desde la raíz levanta los tres procesos. |

## Bugs de lógica

| Problema | Antes | Ahora |
|---|---|---|
| ✅ Email `hola` | Se registraba (backend y front: `noValidate` sin `pattern`) | 400 en backend; el form lo bloquea sin llamar al servidor |
| ✅ `nombre` enviado como objeto | Se guardaba como `[object Object]` | 400 "El nombre debe ser texto" |
| ✅ Nombre `"   "` (registro y perfil) | Se aceptaba | 400 "El nombre es obligatorio" |
| ✅ Contraseña numérica (`123456789`) | 500 (`Illegal arguments` de bcrypt) | 400 con mensaje |
| ✅ Nombre de más de 100 caracteres | 500 genérico (`Data too long`) | 400 con mensaje |
| Contraseña de más de 72 bytes | bcrypt truncaba en silencio | 400 con mensaje |
| ✅ Dos registros simultáneos, mismo email | Uno terminaba en 500 | 409 (se captura `ER_DUP_ENTRY`) |
| ✅ JSON mal formado | Página HTML con stack trace y rutas internas del servidor | 400 en JSON |
| Rutas inexistentes | HTML por defecto de Express | 404 en JSON |
| Emails con mayúsculas/espacios | Dependía de la collation de MySQL | Se normalizan (trim + minúsculas) |
| Login: tiempo de respuesta distinto si el email existe o no | Permitía averiguar qué emails están registrados | Se compara siempre contra un hash (falso si no existe) |
| `PUT /me` | Devolvía solo un mensaje | Devuelve el usuario guardado |
| `JWT_SECRET` ausente | 500 al primer login | El backend no arranca y lo explica |
| CORS abierto a cualquier origen | `cors()` sin restricciones | Solo los orígenes de `CORS_ORIGIN` (por defecto 5173/5174). Por eso los puertos de Vite ahora son fijos (`strictPort`): si saltara a otro puerto, el backend lo rechazaría. |

## Frontend (ambas versiones)

| Problema | Antes | Ahora |
|---|---|---|
| ✅ Backend caído al recargar con sesión iniciada | **Se borraba el token**: la sesión se perdía por un fallo de red | Solo se borra ante 401/404; ante un fallo de red se conserva y se avisa |
| Token vence con la app abierta | La UI seguía "logueada" y fallaba en silencio | Interceptor de Axios: cierra sesión y muestra "Tu sesión expiró" |
| ✅ Perfil con nombre vacío | No pasaba nada (sin mensaje) | Muestra el error del campo |
| Perfil: mensajes de éxito y error | Mismo estilo para ambos | Colores distintos (`.exito` / `.error`) |
| ✅ Router: usuario logueado en `/login` o `/register` | Veía el formulario | `PublicRoute` lo redirige al panel (la versión useState ya lo hacía) |
| Doble clic en Entrar/Registrarme (no reproducido en el original; el botón no tenía estado de envío) | Podía enviar dos peticiones | Botón deshabilitado mientras envía |
| URL de la API fija en el código | `http://localhost:4000/api` | Configurable con `VITE_API_URL` (por defecto igual que antes) |
| useState: `useEffect` sin `vista` en dependencias; prop `vista` sin usar | Incumplía la regla `exhaustive-deps` de React / dato muerto | Dependencias corregidas; se usa para marcar la sección activa |
| Formularios | Sin `autocomplete` ni `role="alert"` | Agregados (gestores de contraseñas y lectores de pantalla) |

## Cómo se verificó

- **Backend:** 23 escenarios contra MariaDB 10.11 real (casos normales, límites, concurrencia, CORS) + 5 escenarios de fallo de arranque.
- **Frontend:** 13 tests de comportamiento por versión (Vitest + Testing Library), 26 en total; ambos `vite build` compilan.
- **Integración:** `npm run dev` desde la raíz con base real.

## Lo que NO se cambió / limitaciones

- No se agregó rate limiting de login (indicado en el README como pendiente).
- El JWT sigue guardándose en `localStorage` (decisión de diseño original; es sensible a XSS. Para producción conviene una cookie `httpOnly`).
- No se probó en un navegador real (los tests usan jsdom) ni con MySQL de Oracle: se usó MariaDB, que es compatible en todo lo que usa este proyecto.
- El `.env` **no se incluye**: tiene contraseñas. Copiá `.env.example` a `.env`.
