# 🎯 CREAR SITE EN NETLIFY DASHBOARD (PASO A PASO)

Ya estás autenticado en Netlify como **android@softvibes.com.mx** en el team **Softvibes**.

---

## 📋 PASO 1: CREAR EL SITE DESDE DASHBOARD

### 1.1 Ir a Netlify Dashboard

Abre en tu navegador: **https://app.netlify.com**

### 1.2 Agregar nuevo site

1. Haz clic en **"Add new site"**
2. Selecciona **"Import an existing project"**

### 1.3 Conectar con Git

1. Selecciona tu proveedor:
   - Si tu repo está en **GitHub**: Click en **"Deploy with GitHub"**
   - Si está en **GitLab**: Click en **"Deploy with GitLab"**
   - Si está en **Bitbucket**: Click en **"Deploy with Bitbucket"**

2. Autoriza Netlify si te lo pide

3. Busca tu repositorio: **`elmecV2-Demo`** o **`RogerDevAndroid/elmecV2-Demo`**

4. Selecciona el repositorio

---

## ⚙️ PASO 2: CONFIGURAR BUILD SETTINGS

En la pantalla de configuración, completa lo siguiente:

### Branch to deploy:

```
netifly
```

### Build command:

```
npm ci && npm run build:production
```

### Publish directory:

```
dist
```

### Build settings:

- **Las demás configuraciones déjalas por defecto**

---

## 🔐 PASO 3: CONFIGURAR VARIABLES DE ENTORNO

**⚠️ IMPORTANTE: Antes de hacer el deploy, configura las variables de entorno**

1. Haz clic en **"Advanced"** o **"Show advanced"**

2. Busca la sección **"Environment variables"** o **"New variable"**

3. Agrega cada una de estas 5 variables:

### Variable 1:

```
Key: EXPO_PUBLIC_SUPABASE_URL
Value: https://pdpqkgrqlubyzkcivifk.supabase.co
```

### Variable 2:

```
Key: EXPO_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkcHFrZ3JxbHVieXprY2l2aWZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMDk3MzgsImV4cCI6MjA3NDc4NTczOH0.xcjdhR89okeqaMGeq5oYAjuvRk56H9-Wc8SXjHpPls4
```

### Variable 3:

```
Key: EXPO_PUBLIC_ENVIRONMENT
Value: production
```

### Variable 4:

```
Key: NODE_ENV
Value: production
```

### Variable 5:

```
Key: EXPO_PUBLIC_EAS_PROJECT_ID
Value: elmec-mobile-app-demo
```

**Cómo agregar cada variable:**

- Click en **"Add variable"** o **"New variable"**
- Pega el **Key** (nombre)
- Pega el **Value** (valor)
- Click en **"Add"** o **"Save"**
- Repite para las 5 variables

---

## 🚀 PASO 4: DEPLOY

Una vez que tengas:

- ✅ Branch: `netifly`
- ✅ Build command configurado
- ✅ Publish directory: `dist`
- ✅ 5 variables de entorno agregadas

**Haz clic en el botón "Deploy [nombre-del-site]"**

---

## ⏱️ PASO 5: ESPERAR EL BUILD

1. Serás redirigido a la página de **Deploys**

2. Verás el progreso del build en tiempo real:

   ```
   ⏳ Building...
   ```

3. Puedes hacer clic en el deploy para ver los logs detallados

4. El build tomará aproximadamente **3-5 minutos**

5. Espera a ver:
   ```
   ✅ Published
   ```

---

## 🎉 PASO 6: OBTENER LA URL

Una vez que el deploy complete exitosamente:

1. En la parte superior verás la URL del site, algo como:

   ```
   https://clever-unicorn-123abc.netlify.app
   ```

   o

   ```
   https://elmec-mobile-app.netlify.app
   ```

2. **COPIA ESA URL** (la necesitaremos para los siguientes pasos)

3. Haz clic en la URL para abrir tu aplicación

---

## ✅ PASO 7: VERIFICAR QUE FUNCIONE

Una vez que abras la URL:

1. Deberías ver la pantalla de login de ELMEC

2. Prueba hacer login con estas credenciales:

### Admin:

```
Email: i.pineda@elmec.com.mx
Password: Elmec2024!Admin
```

### Si el login funciona: ¡SUCCESS! 🎉

### Si el login NO funciona:

- Avísame y revisaremos las variables de entorno
- Verificaremos los logs de Netlify
- Revisaremos la configuración de Supabase

---

## 📝 PRÓXIMOS PASOS DESPUÉS DEL DEPLOY EXITOSO:

### 1. Configurar la URL en Supabase

1. Ve a: https://supabase.com/dashboard/project/pdpqkgrqlubyzkcivifk
2. **Authentication** > **URL Configuration**
3. Agrega tu URL de Netlify en:
   - **Site URL**: `https://tu-url.netlify.app`
   - **Redirect URLs**:
     ```
     https://tu-url.netlify.app/**
     https://tu-url.netlify.app/auth/callback
     ```

### 2. Actualizar app.json con la URL real

1. Edita el archivo `app.json` en tu proyecto
2. Busca la línea: `"origin": "https://your-app.netlify.app/"`
3. Reemplázala con: `"origin": "https://tu-url-real.netlify.app/"`
4. Haz commit y push:
   ```bash
   git add app.json
   git commit -m "chore: update Netlify URL in app.json"
   git push origin netifly
   ```
5. Netlify detectará el push y hará redeploy automático

---

## 🆘 SI ALGO SALE MAL:

### El build falla:

1. Ve a **Deploys** > Click en el deploy fallido
2. Revisa los logs para ver el error
3. Verifica que las variables de entorno estén correctas
4. Avísame qué error ves

### El login no funciona:

1. Abre la consola del navegador (F12)
2. Ve a la pestaña **Console**
3. Intenta hacer login
4. Copia cualquier error que veas y avísame

### La página muestra error 404:

- Verifica que el **Publish directory** sea `dist`
- Verifica que el build haya completado exitosamente

---

## ✅ CHECKLIST:

- [ ] Abrí https://app.netlify.com
- [ ] Click en "Add new site" > "Import project"
- [ ] Conecté con mi proveedor Git
- [ ] Seleccioné el repo `elmecV2-Demo`
- [ ] Configuré branch: `netifly`
- [ ] Configuré build command: `npm ci && npm run build:production`
- [ ] Configuré publish directory: `dist`
- [ ] Agregué las 5 variables de entorno
- [ ] Click en "Deploy site"
- [ ] Esperé a que el build completara
- [ ] Obtuve la URL del site
- [ ] Probé el login y funcionó ✅

---

**Una vez que completes estos pasos, avísame:**

1. Si el deploy fue exitoso ✅
2. Cuál es la URL de tu site
3. Si el login funciona o no

¡Y continuaremos con los pasos finales! 🚀
