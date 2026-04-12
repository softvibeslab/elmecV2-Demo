# 🚀 Guía Completa de Deploy en Netlify

Esta guía te llevará paso a paso para desplegar tu aplicación ELMEC en Netlify conectada a Supabase.

---

## ✅ PRE-REQUISITOS COMPLETADOS

- [x] Supabase configurado y funcionando
- [x] 17 usuarios creados en Auth
- [x] 6 tablas principales verificadas
- [x] Credenciales de producción configuradas
- [x] Configuración de `netlify.toml` lista
- [x] Variables de entorno preparadas

---

## 📋 PASO 1: Crear Proyecto en Netlify

### Opción A: Deploy desde GitHub (Recomendado)

1. Ve a [https://app.netlify.com](https://app.netlify.com)
2. Haz clic en **"Add new site"** > **"Import an existing project"**
3. Conecta con tu proveedor de Git (GitHub, GitLab, etc.)
4. Selecciona el repositorio: `elmecV2-Demo`
5. Configura el build:
   - **Branch to deploy**: `netifly`
   - **Build command**: `npm ci && npm run build:production`
   - **Publish directory**: `dist`
   - **Node version**: Se tomará de `netlify.toml` (20.19.4)

### Opción B: Deploy Manual con CLI

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Login en Netlify
netlify login

# Deploy
npm run deploy
```

---

## 🔐 PASO 2: Configurar Variables de Entorno en Netlify

Una vez creado el site en Netlify:

1. Ve a **Site settings** > **Environment variables**
2. Haz clic en **"Add a variable"**
3. Agrega las siguientes variables:

### Variables Requeridas:

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://pdpqkgrqlubyzkcivifk.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkcHFrZ3JxbHVieXprY2l2aWZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMDk3MzgsImV4cCI6MjA3NDc4NTczOH0.xcjdhR89okeqaMGeq5oYAjuvRk56H9-Wc8SXjHpPls4

# Entorno
EXPO_PUBLIC_ENVIRONMENT=production
NODE_ENV=production

# Proyecto
EXPO_PUBLIC_EAS_PROJECT_ID=elmec-mobile-app-demo
```

### Cómo agregar cada variable:

1. **Key**: `EXPO_PUBLIC_SUPABASE_URL`
   **Value**: `https://pdpqkgrqlubyzkcivifk.supabase.co`
   **Scopes**: Selecciona "Production" y "Deploy previews"

2. **Key**: `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   **Value**: (La clave anon completa)
   **Scopes**: Selecciona "Production" y "Deploy previews"

3. **Key**: `EXPO_PUBLIC_ENVIRONMENT`
   **Value**: `production`
   **Scopes**: Solo "Production"

4. **Key**: `NODE_ENV`
   **Value**: `production`
   **Scopes**: Solo "Production"

5. **Key**: `EXPO_PUBLIC_EAS_PROJECT_ID`
   **Value**: `elmec-mobile-app-demo`
   **Scopes**: Selecciona ambos

---

## 🌐 PASO 3: Configurar Dominio en Supabase

1. Ve a tu proyecto en Supabase Dashboard
2. **Authentication** > **URL Configuration**
3. Agrega la URL de Netlify en:
   - **Site URL**: `https://tu-app.netlify.app`
   - **Redirect URLs**:
     ```
     https://tu-app.netlify.app/**
     https://tu-app.netlify.app/auth/callback
     ```

---

## 🚀 PASO 4: Hacer el Deploy

### Si usas GitHub (Deploy Automático):

1. Haz commit de los cambios:

   ```bash
   git add .
   git commit -m "chore: configurar para deploy en Netlify"
   git push origin netifly
   ```

2. Netlify detectará el push y comenzará el build automáticamente

3. Monitorea el progreso en:
   - **Deploys** tab en Netlify Dashboard
   - Verás el log del build en tiempo real

### Si usas CLI (Deploy Manual):

```bash
# Preview deploy
npm run deploy:preview

# Production deploy
npm run deploy
```

---

## 📊 PASO 5: Verificar el Deploy

Una vez completado el build:

1. **Verifica el site esté activo**: Haz clic en el link del site
2. **Prueba el login** con estas credenciales:

### 👨‍💼 Admin

```
Email: i.pineda@elmec.com.mx
Password: Elmec2024!Admin
```

### 👷 Agente

```
Email: j.gonzalez@elmec.com.mx
Password: Elmec2024!Agent
```

### 👤 Cliente

```
Email: cliente@gmail.com
Password: Elmec2024!Client
```

3. **Verifica funcionalidades**:
   - [ ] Login funciona correctamente
   - [ ] Dashboard carga datos de Supabase
   - [ ] Puedes crear solicitudes
   - [ ] El chat funciona
   - [ ] La calculadora funciona

---

## 🔧 PASO 6: Actualizar app.json con URL Real

Una vez que tengas tu URL de Netlify (ej: `https://elmec-app.netlify.app`):

1. Edita `app.json`
2. Reemplaza `https://your-app.netlify.app/` con tu URL real
3. Haz commit y push para re-deploy

```json
{
  "expo": {
    "plugins": [
      [
        "expo-router",
        {
          "origin": "https://tu-url-real.netlify.app/"
        }
      ]
    ]
  }
}
```

---

## 🎯 CHECKLIST FINAL

Antes de considerar el deploy exitoso, verifica:

### Infraestructura

- [ ] Site deployado en Netlify
- [ ] URL accesible públicamente
- [ ] Build completado sin errores
- [ ] Variables de entorno configuradas

### Supabase

- [ ] Conexión a base de datos funciona
- [ ] Auth funciona correctamente
- [ ] Políticas RLS activas
- [ ] Dominios configurados en Supabase

### Funcionalidad

- [ ] Login funciona
- [ ] Registro de usuarios funciona
- [ ] Dashboard carga datos
- [ ] Chat funciona
- [ ] Calculadora funciona
- [ ] Notificaciones funcionan

### Seguridad

- [ ] Headers de seguridad activos
- [ ] CSP configurado
- [ ] HTTPS activo
- [ ] No hay credenciales expuestas

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### Error: "Build failed"

**Problema**: El build falla en Netlify

**Solución**:

1. Verifica que Node 20.19.4 esté configurado en `netlify.toml`
2. Revisa el log de build en Netlify
3. Asegúrate de que todas las variables de entorno estén configuradas

### Error: "Cannot connect to Supabase"

**Problema**: La app no se conecta a Supabase

**Solución**:

1. Verifica variables de entorno en Netlify
2. Confirma que la URL de Netlify esté en Supabase > Authentication > URL Configuration
3. Revisa que las credenciales sean correctas

### Error: "Login failed"

**Problema**: El login no funciona

**Solución**:

1. Verifica que los usuarios existan en Supabase Auth
2. Confirma que "Email confirmation" esté deshabilitado o que los emails estén confirmados
3. Revisa políticas RLS en Supabase

### Error: "Cannot read from database"

**Problema**: No se cargan datos

**Solución**:

1. Verifica que las migraciones estén ejecutadas
2. Revisa políticas RLS (pueden estar bloqueando acceso)
3. Confirma que hay datos de prueba en las tablas

---

## 📝 COMANDOS ÚTILES

```bash
# Ver logs de Netlify CLI
netlify logs

# Abrir dashboard de Netlify
netlify open

# Ver configuración actual
netlify env:list

# Test local de producción
npm run build:production
npm run preview
```

---

## 🎉 ¡DEPLOY EXITOSO!

Si llegaste hasta aquí y todo funciona, ¡felicidades! 🎊

Tu aplicación ELMEC está ahora:

- ✅ Deployada en Netlify
- ✅ Conectada a Supabase
- ✅ Accesible públicamente
- ✅ Con HTTPS activo
- ✅ Lista para producción

---

## 📞 SOPORTE

Si necesitas ayuda:

1. Revisa los logs en Netlify Dashboard
2. Verifica la conexión con Supabase usando `npm run test-supabase`
3. Consulta la documentación de Netlify: https://docs.netlify.com
4. Consulta la documentación de Supabase: https://supabase.com/docs

---

**Desarrollado con ❤️ para ELMEC**
