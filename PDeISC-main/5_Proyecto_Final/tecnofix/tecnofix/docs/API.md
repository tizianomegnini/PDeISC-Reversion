# API REST — `http://localhost:3000/api/v1`

Formato JSON. Autenticación: cookie httpOnly (web) o `Authorization: Bearer <token>` (móvil; pedir el token con el header `X-Client: mobile` en login/registro).
Con cookie, los métodos que modifican datos exigen `X-Requested-With: tecnofix`.
Errores: `{ "error": "mensaje", "detalles": [{ "campo", "mensaje" }] }` con códigos 400 (validación), 401 (sin sesión), 403 (rol/contraseña provisoria), 404, 409 (conflicto/estado inválido), 501 (login social pendiente).

## Autenticación
| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| POST | `/auth/register` | público | Alta de **cliente** (el rol no es elegible). `{nombre, apellido, email, telefono?, password}` |
| POST | `/auth/login` | público | `{email, password}` |
| POST | `/auth/logout` | — | Borra la cookie |
| GET | `/auth/me` | autenticado | Usuario actual |
| PUT | `/auth/me` | autenticado | `{nombre, apellido, telefono}` |
| POST | `/auth/change-password` | autenticado | `{actual, nueva}`; obligatorio si `debe_cambiar_password` |
| GET | `/auth/social` | público | Estado de Google/Facebook/Apple (`configurado`) |
| ANY | `/auth/social/:proveedor` | público | 501: pendiente de configuración |

## Consultas (cada rol ve solo lo suyo; el admin ve todo)
| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/consultas?estado=` | cliente/técnico/admin | Listado filtrado por rol |
| POST | `/consultas` | cliente | `{tipo_equipo, marca, modelo, descripcion}`; intenta asignar en la misma transacción |
| GET | `/consultas/:id` | dueño / técnico asignado / admin | Detalle con técnico y local |
| PATCH | `/consultas/:id/estado` | técnico asignado, cliente dueño | `{estado}`. Técnico: `asignada→en_proceso`, `en_proceso→esperando_cliente\|finalizada`, `esperando_cliente→en_proceso\|finalizada`. Cliente: cualquier estado abierto → `cancelada` |
| GET | `/consultas/:id/mensajes` | idem | Mensajes |
| POST | `/consultas/:id/mensajes` | cliente / técnico | `{contenido}`; no si está cerrada |
| POST | `/consultas/:id/valoracion` | cliente dueño | `{estrellas: 1-5, comentario?}`; solo `finalizada`, una vez |

## Técnico
| GET | `/tecnico/resumen` | técnico | Promedio, valoraciones, trabajos atendidos, activas, límite |

## Administrador (`/admin/*`)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/admin/resumen` | Totales de consultas, técnicos, locales, valoraciones |
| GET | `/admin/estadisticas` | Por técnico y por local |
| GET/POST | `/admin/tecnicos` | Listado / alta (devuelve `password_temporal` una sola vez) |
| PUT | `/admin/tecnicos/:id` | Editar datos, local, `limite_consultas`, `habilitado` |
| POST | `/admin/tecnicos/:id/estado` | `{activo: boolean}` activar/desactivar |
| DELETE | `/admin/tecnicos/:id` | Eliminación lógica (conserva historial) |
| GET/POST | `/admin/locales` | Listado con estadísticas / alta |
| PUT / DELETE | `/admin/locales/:id` | Editar / desactivar |
| GET | `/admin/consultas/pendientes` | Cola sin asignar |
| POST | `/admin/consultas/:id/asignar` | Reintentar una |
| POST | `/admin/consultas/reintentar` | Reintentar todas |
| GET | `/admin/valoraciones` | Valoraciones |
| GET/PUT | `/admin/configuracion` | `{limite_consultas_default}` (por defecto 20; aplica a técnicos nuevos) |
| GET | `/admin/auditoria` | Últimas 200 operaciones registradas |

`GET /health` devuelve `{ok:true}`.
