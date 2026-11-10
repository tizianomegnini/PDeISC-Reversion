# TecnoFix Soporte para Android (Expo)

Esta es la app React Native. Se conecta al mismo backend que el sitio web; no contiene credenciales de base de datos.

La app se muestra como **TecnoFix Soporte** en el dispositivo y usa el icono y la identidad visual de `assets/`. Incluye tema claro/oscuro persistente, áreas seguras para las barras del sistema, transiciones suaves al desplazarse por las pantallas, una conversación con burbujas inspiradas en WhatsApp y ajuste del scroll al abrir el teclado. En Android, el teclado redimensiona la ventana, oculta la navegación inferior mientras está abierto y deja espacio extra debajo del chat para mantener visible el campo de escritura.

El panel de administración incluye gráficos de actividad por estado, local y técnico, distribución de valoraciones y diálogos de confirmación para activar, desactivar o eliminar técnicos.

## Probar con Expo Go

1. Instalar Node.js y Expo Go en el teléfono.
2. Desde esta carpeta, ejecutar:

   ```powershell
   npm install
   npx expo start
   ```

3. Escanear el QR desde Expo Go. La API por defecto es el backend de Railway. Para apuntar a otro entorno, crear `.env` a partir de `.env.example` y cambiar `EXPO_PUBLIC_API_URL`.

Expo Go sirve para probar la app durante el desarrollo; no es el APK instalable final.

## Desarrollo con TypeScript

El código móvil usa TypeScript (`.ts` y `.tsx`). Al instalar dependencias, se instalan también TypeScript y los tipos de React. Para validar los tipos antes de iniciar Expo o generar un APK:

```powershell
npm run typecheck
```

### Organización del código

- `src/features/auth`: inicio de sesión, registro y autenticación social.
- `src/features/consultations`: listado, creación y detalle de consultas.
- `src/features/admin`: gestión administrativa.
- `src/features/profile`: perfil y cambio de contraseña.
- `src/features/notifications`: registro y baja de notificaciones push.
- `src/api.ts`: comunicación HTTP con el backend.
- `src/types.ts` y `src/ui.tsx`: tipos y componentes compartidos.

Cada funcionalidad exporta su API pública desde `index.ts`; `App.tsx` compone esas funcionalidades sin depender de sus archivos internos.

## Generar un APK con EAS

1. Instalar dependencias y autenticarse con la cuenta de Expo:

   ```powershell
   npm install
   npx eas login
   npx eas build:configure
   ```

2. En `app.json`, fijar `expo.extra.eas.projectId` con el Project ID asignado por EAS al configurar el proyecto. El proceso de configuración también puede modificar esa propiedad automáticamente.
3. Iniciar el build de prueba, que genera un APK descargable:

   ```powershell
   npx eas build --platform android --profile preview
   ```

4. Cuando EAS finalice el build, abrir el enlace que muestra y descargar el `.apk` en el teléfono para instalarlo.

El perfil `production` está preparado para una compilación de distribución; EAS genera normalmente un AAB para Google Play. Para compartir e instalar directamente un APK, usar el perfil `preview`.

## Notificaciones push

La app registra el dispositivo después de iniciar sesión como cliente o técnico. Las notificaciones abren la consulta correspondiente y avisan sobre cambios de estado, mensajes nuevos y valoraciones recibidas por el técnico. El texto de los mensajes y comentarios no se envía al proveedor push.

Para habilitarlas en producción:

1. Desplegar el backend actualizado y ejecutar `npm run db:init` desde `backend/` contra la base de producción. Esto crea `push_tokens` sin borrar las demás tablas ni sus datos; no usar `npm run db:reset`.
2. En Firebase, crear una app Android con el package `com.tecnofix.app` y generar una clave de cuenta de servicio de Firebase Cloud Messaging (FCM V1).
3. Cargar esa clave en las credenciales de Android del proyecto EAS (`npx eas credentials --platform android`). No guardar ni subir el archivo de clave al repositorio.
4. Generar e instalar un APK nuevo con el perfil `preview`. Las notificaciones push se deben probar en un dispositivo físico; Android debe tener habilitado el permiso de notificaciones para TecnoFix.

La app solicita permiso al iniciar sesión. Si se rechaza, se puede habilitar desde los ajustes del sistema. Al cerrar sesión, se intenta desvincular el token push del usuario.

## Cuenta y seguridad

- El cliente inicia sesión con email y contraseña o se registra como cliente.
- Los roles técnico y administrador usan el mismo inicio de sesión; el backend controla permisos y pantallas por rol.
- El token de sesión móvil se guarda con `expo-secure-store` y se envía al backend como Bearer token.
- Google, Facebook y GitHub usan el OAuth configurado para el sitio. Al volver del proveedor, la API entrega a la app un código temporal de un solo uso; el token de sesión no se envía en el deep link.
- Para Expo Go, iniciar el proyecto con `npx expo start` y probar el proveedor desde el teléfono. Para instalar en un APK, generar el build EAS `preview` y abrir el login desde esa app instalada.
- Antes de habilitar OAuth móvil, desplegar los cambios del backend y crear la tabla de códigos efímeros en la base de datos de producción ejecutando `npm run db:init` desde `backend/` con la configuración de producción. Este comando crea las tablas que falten y no elimina los datos; no usar `npm run db:reset`.
- Si se cambia el backend, configurar `EXPO_PUBLIC_API_URL` antes de crear el build.
