# Configuración de Variables de Entorno en Netlify

## Problema Identificado

Los errores de autenticación en el deploy de Netlify se deben a:

1. Variables de entorno no configuradas en Netlify
2. Usuario intentando hacer login sin existir en `auth.users`

## Solución: Configurar Variables de Entorno

### Paso 1: Acceder a la configuración de Netlify

1. Ve a tu dashboard de Netlify: https://app.netlify.com
2. Selecciona tu proyecto ELMEC
3. Ve a **Site settings** → **Environment variables**

### Paso 2: Agregar las variables de entorno

Agrega las siguientes variables de entorno con los valores de tu proyecto:

```
EXPO_PUBLIC_SUPABASE_URL=https://pdpqkgrqlubyzkcivifk.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkcHFrZ3JxbHVieXprY2l2aWZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMDk3MzgsImV4cCI6MjA3NDc4NTczOH0.xcjdhR89okeqaMGeq5oYAjuvRk56H9-Wc8SXjHpPls4
EXPO_PUBLIC_ENVIRONMENT=production
EXPO_PUBLIC_BASIC_AUTH=false
```

### Paso 3: Hacer un nuevo deploy

Después de configurar las variables, haz un nuevo deploy:

```bash
# Opción 1: Push a git para trigger automático
git add .
git commit -m "fix: configure environment variables"
git push

# Opción 2: Deploy manual con Netlify CLI
netlify deploy --prod
```

## Credenciales de Prueba Válidas

Las siguientes credenciales funcionan correctamente:

**Contraseña para todos:** `abc321`

**Usuarios disponibles:**

- c.rosales@elmec.com.mx
- alex.diaz@elmec.com.mx
- s.vazquez@elmec.com.mx
- o.salazar@elmec.com.mx
- e.navarrete@elmec.com.mx
- j.pena@elmec.com.mx
- g.rosales@elmec.com.mx
- a.salazar@elmec.com.mx
- a.cano@elmec.com.mx
- j.larrea@elmec.com.mx
- a.licona@elmec.com.mx
- r.martinez@elmec.com.mx
- i.munoz@elmec.com.mx

## Verificación

Para verificar que las credenciales funcionan localmente:

```bash
npm run test-logins
```

Este comando probará todos los usuarios ELMEC con la contraseña `abc321`.

## Notas Importantes

1. Todos los usuarios listados arriba han sido verificados y tienen credenciales válidas en `auth.users`.

2. Los errores de `.ldb` son causados por extensiones del navegador (Chrome) y no afectan la funcionalidad del login. Se pueden ignorar.

3. Asegúrate de que la configuración de seguridad (CSP) en `netlify.toml` permite conexiones a Supabase.
