# 🎯 PASOS PARA CONFIGURAR NETLIFY (HAZLO TÚ AHORA)

## ✅ LO QUE YA ESTÁ LISTO:

- ✅ Netlify CLI instalado
- ✅ Código commiteado en branch `netifly`
- ✅ Configuración lista en `netlify.toml`
- ✅ Supabase funcionando 100%

---

## 🚀 PASO 1: AUTENTICARSE EN NETLIFY

Ejecuta este comando en tu terminal:

```bash
netlify login
```

**Lo que va a pasar**:

1. Se abrirá tu navegador automáticamente
2. Te pedirá que autorices Netlify CLI
3. Haz clic en "Authorize"
4. Verás un mensaje de éxito

---

## 🌐 PASO 2: CREAR EL SITE EN NETLIFY

### Opción A: Deploy desde tu repositorio Git (RECOMENDADO)

1. Ve a [https://app.netlify.com](https://app.netlify.com)

2. Haz clic en **"Add new site"** > **"Import an existing project"**

3. Selecciona tu proveedor de Git:
   - Si usas GitHub, selecciona **"Deploy with GitHub"**
   - Autoriza Netlify si es necesario

4. Busca y selecciona tu repositorio: **`elmecV2-Demo`**

5. Configura el deploy:

   ```
   Branch to deploy: netifly
   Build command: npm ci && npm run build:production
   Publish directory: dist
   ```

6. **¡NO HAGAS CLICK EN DEPLOY TODAVÍA!**

7. Ve a **"Site settings"** > **"Environment variables"**

---

## 🔐 PASO 3: CONFIGURAR VARIABLES DE ENTORNO

En **Site settings** > **Environment variables**, agrega las siguientes:

### Variable 1: EXPO_PUBLIC_SUPABASE_URL

```
Key: EXPO_PUBLIC_SUPABASE_URL
Value: https://pdpqkgrqlubyzkcivifk.supabase.co
Scopes: ☑️ Production  ☑️ Deploy previews
```

### Variable 2: EXPO_PUBLIC_SUPABASE_ANON_KEY

```
Key: EXPO_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkcHFrZ3JxbHVieXprY2l2aWZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMDk3MzgsImV4cCI6MjA3NDc4NTczOH0.xcjdhR89okeqaMGeq5oYAjuvRk56H9-Wc8SXjHpPls4
Scopes: ☑️ Production  ☑️ Deploy previews
```

### Variable 3: EXPO_PUBLIC_ENVIRONMENT

```
Key: EXPO_PUBLIC_ENVIRONMENT
Value: production
Scopes: ☑️ Production  ☐ Deploy previews
```

### Variable 4: NODE_ENV

```
Key: NODE_ENV
Value: production
Scopes: ☑️ Production  ☐ Deploy previews
```

### Variable 5: EXPO_PUBLIC_EAS_PROJECT_ID

```
Key: EXPO_PUBLIC_EAS_PROJECT_ID
Value: elmec-mobile-app-demo
Scopes: ☑️ Production  ☑️ Deploy previews
```

---

## 📸 CÓMO AGREGAR CADA VARIABLE:

1. Haz clic en **"Add a variable"** o **"New variable"**
2. Ingresa el **Key** (nombre de la variable)
3. Ingresa el **Value** (valor)
4. Selecciona los **Scopes** (dónde aplicar):
   - **Production**: Para el sitio en vivo
   - **Deploy previews**: Para previews de cambios
5. Haz clic en **"Save"** o **"Create variable"**
6. Repite para las 5 variables

---

## 🚀 PASO 4: HACER EL PRIMER DEPLOY

### Si creaste el site desde Netlify Dashboard:

1. Ve a **Deploys** en el menú
2. Haz clic en **"Trigger deploy"** > **"Deploy site"**
3. Espera a que el build complete (toma 3-5 minutos)
4. Verás el progreso en tiempo real

### Si quieres usar CLI:

```bash
# Inicializar el site
netlify init

# Sigue las instrucciones:
# - Selecciona "Create & configure a new site"
# - Elige tu team
# - Dale un nombre al site (ej: elmec-mobile-app)
# - Build command: npm ci && npm run build:production
# - Publish directory: dist

# Luego deploy:
netlify deploy --prod
```

---

## 📊 PASO 5: MONITOREAR EL BUILD

Una vez que el deploy inicie:

1. Ve a **Deploys** en Netlify Dashboard
2. Haz clic en el deploy que está corriendo
3. Verás los logs en tiempo real
4. El build debe completarse sin errores

**Duración esperada**: 3-5 minutos

---

## ✅ PASO 6: VERIFICAR QUE TODO FUNCIONE

Una vez que el deploy complete exitosamente:

1. **Copia la URL** del site (algo como `https://tu-site.netlify.app`)

2. **Abre la URL** en tu navegador

3. **Prueba el login** con estas credenciales:

### Admin:

```
Email: i.pineda@elmec.com.mx
Password: Elmec2024!Admin
```

### Agente:

```
Email: j.gonzalez@elmec.com.mx
Password: Elmec2024!Agent
```

### Cliente:

```
Email: cliente@gmail.com
Password: Elmec2024!Client
```

4. **Verifica que funcione**:
   - [ ] Login exitoso
   - [ ] Dashboard carga
   - [ ] Puedes ver solicitudes
   - [ ] El chat funciona
   - [ ] La calculadora funciona

---

## 🔧 PASO 7: CONFIGURAR LA URL EN SUPABASE

Una vez que tengas la URL de Netlify:

1. Ve a **Supabase Dashboard**: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Authentication** > **URL Configuration**
4. Agrega tu URL de Netlify en:
   - **Site URL**: `https://tu-site.netlify.app`
   - **Redirect URLs**:
     ```
     https://tu-site.netlify.app/**
     https://tu-site.netlify.app/auth/callback
     ```
5. Haz clic en **Save**

---

## 📝 PASO 8: ACTUALIZAR app.json CON LA URL REAL

Una vez que sepas tu URL definitiva:

1. Edita `app.json`
2. Busca la línea que dice: `"origin": "https://your-app.netlify.app/"`
3. Reemplázala con tu URL real: `"origin": "https://tu-site-real.netlify.app/"`
4. Guarda el archivo
5. Haz commit:
   ```bash
   git add app.json
   git commit -m "chore: update Netlify URL in app.json"
   git push origin netifly
   ```
6. Netlify detectará el push y hará redeploy automáticamente

---

## 🎉 ¡LISTO!

Si completaste todos estos pasos, tu aplicación debería estar:

- ✅ Deployada en Netlify
- ✅ Conectada a Supabase
- ✅ Accesible públicamente
- ✅ Con login funcionando
- ✅ Lista para usar

---

## 🆘 SI ALGO SALE MAL:

### Error en el Build:

1. Revisa los logs en Netlify Dashboard
2. Busca el error específico
3. Verifica que las variables de entorno estén bien configuradas
4. Asegúrate de que Node 20.19.4 se esté usando (debe tomarse de netlify.toml)

### Login no funciona:

1. Verifica variables de entorno en Netlify
2. Confirma que la URL esté configurada en Supabase
3. Revisa la consola del navegador para ver errores

### Build se queda "stuck":

1. Cancela el deploy
2. Verifica que la configuración sea correcta
3. Intenta de nuevo

---

## 📞 COMANDOS ÚTILES:

```bash
# Ver el site en el navegador
netlify open

# Ver logs
netlify logs

# Listar variables de entorno
netlify env:list

# Hacer deploy manual
netlify deploy --prod
```

---

## ✅ CHECKLIST FINAL:

- [ ] Netlify CLI instalado
- [ ] Autenticado en Netlify (`netlify login`)
- [ ] Site creado en Netlify
- [ ] 5 variables de entorno configuradas
- [ ] Deploy ejecutado
- [ ] Build completado exitosamente
- [ ] URL del site funciona
- [ ] Login funciona con las credenciales
- [ ] URL configurada en Supabase
- [ ] app.json actualizado con URL real
- [ ] Redeploy automático completado

---

**¡Sigue estos pasos y estarás en producción en menos de 10 minutos!** 🚀

Si tienes algún problema en cualquier paso, avísame y te ayudo a resolverlo.
