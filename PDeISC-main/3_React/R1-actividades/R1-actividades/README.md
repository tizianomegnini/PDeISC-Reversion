# TP React – Actividades separadas

Cada actividad es una app de Vite independiente y corre en su propio localhost.

| Actividad | Carpeta | URL |
|---|---|---|
| 1 · Hola mundo | `actividad-1-hola-mundo` | http://localhost:5171 |
| 2 · Tarjeta de presentación | `actividad-2-tarjeta` | http://localhost:5172 |
| 3 · Contador | `actividad-3-contador` | http://localhost:5173 |
| 4 · Lista de tareas | `actividad-4-lista-tareas` | http://localhost:5174 |
| 5 · Formulario simple | `actividad-5-formulario` | http://localhost:5175 |

## Cómo correrlo

Una sola vez, en esta carpeta:

```bash
npm install
```

Levantar las 5 a la vez:

```bash
npm run dev
```

Levantar una sola:

```bash
npm run dev:1   # o dev:2, dev:3, dev:4, dev:5
```

(También se puede entrar a una carpeta y correr `npm run dev` ahí mismo.)

## Notas

- Los puertos están fijos (`strictPort: true`). Si alguno está ocupado, Vite avisa en lugar de cambiarlo.
- El header de cada página tiene links a las otras 4 actividades.
- El modo claro/oscuro se guarda en `localStorage`, que es distinto por puerto: cada actividad recuerda su propio tema.
