# Elmec MFR Store Readiness - 2026-05-14

## Estado general

El proyecto quedo preparado para builds de prueba y distribucion en tiendas con Expo/EAS.

Validaciones locales realizadas:

- `npx expo-doctor`: 17/17 checks passed.
- `npx tsc --noEmit --pretty false`: sin errores.
- `npx expo install --check`: dependencias compatibles con Expo SDK 53.
- `npm audit --omit=dev --audit-level=high`: sin vulnerabilidades high/critical en dependencias de produccion.

Queda un aviso moderado de `postcss` heredado de Expo/Metro. No se aplico `npm audit fix --force` porque propone bajar Expo a una version incompatible.

## Configuracion de app

- App name: `Elmec MFR`
- Expo slug: `elmec`
- Version: `1.0.3`
- Android package: `com.elmec.mfr`
- Android versionCode: `2`
- iOS bundleIdentifier: `com.elmec.mfr`
- iOS buildNumber: `1`
- EAS project ID: `96c91e46-dc10-43b5-9cd9-4d91217fd50c`

## Perfiles EAS

### Preview

Genera APK instalable directo para pruebas internas.

```bash
npx eas-cli build --platform android --profile preview
```

Ultimo APK generado:

```text
https://expo.dev/artifacts/eas/sbnq1RD6idPQ7CTaX4tEy9.apk
```

Build:

```text
https://expo.dev/accounts/softvibeslab/projects/elmec/builds/d4003d5f-4c81-4c9b-866d-f8ed76f7f128
```

### Production Android

Genera AAB para subir a Google Play.

```bash
npx eas-cli build --platform android --profile production
```

AAB generado:

```text
https://expo.dev/artifacts/eas/hfT5jaw34PAXKZCAHc3cbu.aab
```

Build:

```text
https://expo.dev/accounts/softvibeslab/projects/elmec/builds/83a61b66-b043-4755-9c4c-b4dac4f9cf0c
```

### Production iOS

El proyecto ya tiene `bundleIdentifier`, permisos de privacidad y configuracion de build, pero falta completar credenciales Apple en EAS.

Comando requerido en modo interactivo:

```bash
npx eas-cli build --platform ios --profile production
```

El intento no interactivo fallo con:

```text
Credentials are not set up. Run this command again in interactive mode.
```

## Variables usadas en builds

```env
EXPO_PUBLIC_SUPABASE_URL=https://pdpqkgrqlubyzkcivifk.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=public_anon_key
EXPO_PUBLIC_ENVIRONMENT=production
EXPO_PUBLIC_EAS_PROJECT_ID=96c91e46-dc10-43b5-9cd9-4d91217fd50c
```

No incluir en builds moviles:

```env
SUPABASE_SERVICE_ROLE_KEY
```

## Cambios funcionales incluidos

- Login sin informacion demo visible.
- Roles de Agente y Cliente ajustados.
- Persistencia de sesion con Supabase Auth y AsyncStorage.
- Chat enlazado correctamente a solicitud existente.
- Scroll de chat al ultimo mensaje.
- Notificaciones de chat con payload hacia el modulo correcto.
- Filtros y alcance por zona en directorio, solicitudes y chats/grupos.
- Estatus de solicitudes: `Nuevo`, `Sin atender`, `En progreso`, `Terminado`.
- Cambio automatico a `Sin atender` por SLA.
- Boton `Terminar solicitud` visible en el detalle.
- Cierre de solicitud desactiva/oculta chat relacionado.
- Configuracion Expo compatible con stores: icono cuadrado, Android AAB, iOS bundle ID y permisos.

## Pendiente para publicacion

- Completar credenciales iOS con Apple Developer.
- Crear app en App Store Connect con bundle ID `com.elmec.mfr`.
- Subir AAB a Google Play Console.
- Completar fichas de tiendas, privacidad, clasificacion de contenido y screenshots.
- Hacer pruebas finales con usuarios demo antes de enviar a revision.
