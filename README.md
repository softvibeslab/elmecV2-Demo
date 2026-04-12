# ElmecV2 - Sistema de Gestión de Solicitudes

[![React Native](https://img.shields.io/badge/React%20Native-0.74-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-51-black.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green.svg)](https://supabase.com/)
[![Netlify](https://img.shields.io/badge/Netlify-Deployed-success.svg)](https://netlify.com/)

## 📱 Descripción

ElmecV2 es una aplicación móvil multiplataforma desarrollada con React Native y Expo para la gestión eficiente de solicitudes. La aplicación permite a los usuarios crear, gestionar y hacer seguimiento de solicitudes, mientras que los administradores pueden supervisar el sistema completo a través de un dashboard avanzado.

## ✨ Características Principales

### 👤 Para Usuarios

- **Autenticación Segura**: Login y registro con validación robusta
- **Gestión de Solicitudes**: Crear, editar y hacer seguimiento de solicitudes
- **Calculadora Integrada**: Herramienta de cálculo incorporada
- **Interfaz Intuitiva**: Diseño moderno y fácil de usar
- **Notificaciones**: Actualizaciones en tiempo real del estado de solicitudes

### 👨‍💼 Para Administradores

- **Dashboard Completo**: Visualización de estadísticas y métricas
- **Gestión de Usuarios**: Administración de cuentas y permisos
- **Análisis de Datos**: Gráficos y reportes detallados
- **Monitoreo del Sistema**: Seguimiento de errores y rendimiento

### 🔧 Características Técnicas

- **Multiplataforma**: Compatible con iOS, Android y Web
- **Offline First**: Funcionalidad básica sin conexión
- **Performance Optimizada**: Lazy loading, memoización y FlatList
- **Manejo de Errores**: Sistema robusto de logging y error handling
- **Seguridad**: Autenticación JWT y Row Level Security (RLS)

## 🚀 Tecnologías Utilizadas

### Frontend

- **React Native 0.74** - Framework principal
- **Expo 51** - Plataforma de desarrollo
- **TypeScript** - Tipado estático
- **React Navigation** - Navegación
- **Zustand** - Gestión de estado global
- **TanStack Query** - Gestión de estado del servidor

### Backend

- **Supabase** - Backend as a Service
- **PostgreSQL** - Base de datos
- **Row Level Security** - Seguridad a nivel de fila
- **Real-time subscriptions** - Actualizaciones en tiempo real

### DevOps & Deployment

- **Netlify** - Hosting y deployment
- **GitHub Actions** - CI/CD
- **ESLint & Prettier** - Calidad de código
- **Environment Variables** - Configuración por entorno

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** (versión 18 o superior)
- **npm** o **yarn**
- **Expo CLI**: `npm install -g @expo/cli`
- **Git**

### Para desarrollo móvil:

- **Expo Go** app en tu dispositivo móvil
- O un emulador de Android/iOS configurado

## 🛠️ Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/elmecV2-Demo.git
cd elmecV2-Demo
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env` basado en `.env.example`:

```bash
cp .env.example .env
```

Configura las siguientes variables:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=tu_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key

# Environment
EXPO_PUBLIC_ENVIRONMENT=development

# Expo
EAS_PROJECT_ID=tu_eas_project_id
```

### 4. Configurar Supabase

1. Crea un proyecto en [Supabase](https://supabase.com/)
2. Ejecuta las migraciones de la base de datos (ubicadas en `/supabase/migrations/`)
3. Configura las políticas RLS según la documentación

## 🏃‍♂️ Ejecución del Proyecto

### Desarrollo

```bash
# Iniciar el servidor de desarrollo
npm start

# Para web específicamente
npm run web

# Para Android
npm run android

# Para iOS
npm run ios
```

### Producción

```bash
# Build para producción
npm run build:production

# Deploy a Netlify
npm run deploy

# Preview deployment
npm run deploy:preview
```

## 📁 Estructura del Proyecto

```
elmecV2-Demo/
├── components/           # Componentes reutilizables
│   ├── ui/              # Componentes de UI básicos
│   └── forms/           # Componentes de formularios
├── screens/             # Pantallas de la aplicación
│   ├── auth/           # Pantallas de autenticación
│   ├── admin/          # Pantallas de administración
│   └── user/           # Pantallas de usuario
├── navigation/          # Configuración de navegación
├── store/              # Gestión de estado (Zustand)
├── services/           # Servicios y APIs
├── utils/              # Utilidades y helpers
│   ├── errorHandler.ts # Manejo de errores
│   └── logger.ts       # Sistema de logging
├── types/              # Definiciones de TypeScript
├── assets/             # Recursos estáticos
└── supabase/           # Configuración de Supabase
```

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Tests con coverage
npm run test:coverage

# Linting
npm run lint

# Formateo de código
npm run format
```

## 📊 Scripts Disponibles

| Script                     | Descripción                                |
| -------------------------- | ------------------------------------------ |
| `npm start`                | Inicia el servidor de desarrollo           |
| `npm run web`              | Ejecuta la versión web                     |
| `npm run android`          | Ejecuta en Android                         |
| `npm run ios`              | Ejecuta en iOS                             |
| `npm run build:production` | Build optimizado para producción           |
| `npm run deploy`           | Deploy a producción en Netlify             |
| `npm run deploy:preview`   | Deploy de preview                          |
| `npm run lint`             | Ejecuta ESLint                             |
| `npm run lint:fix`         | Corrige errores de linting automáticamente |
| `npm run format`           | Formatea el código con Prettier            |
| `npm test`                 | Ejecuta los tests                          |

## 🔐 Seguridad

### Autenticación

- JWT tokens para autenticación
- Refresh tokens para sesiones persistentes
- Logout automático por inactividad

### Base de Datos

- Row Level Security (RLS) habilitado
- Políticas de acceso granulares
- Validación de datos en el servidor

### Variables de Entorno

- Todas las claves sensibles en variables de entorno
- Diferentes configuraciones por entorno
- Nunca commitear archivos `.env`

## 🚀 Deployment

### Netlify (Web)

La aplicación se despliega automáticamente en Netlify:

1. **Automático**: Push a `main` despliega a producción
2. **Manual**: `npm run deploy`
3. **Preview**: `npm run deploy:preview`

### Mobile (Expo)

Para deployment móvil:

```bash
# Build para stores
eas build --platform all

# Submit a stores
eas submit --platform all
```

## 📈 Monitoreo y Logging

### Sistema de Errores

- Logging automático de errores
- Categorización por severidad
- Queue local para errores offline
- Integración con servicios externos (preparado para Sentry)

### Performance

- Métricas de rendimiento automáticas
- Logging de acciones de usuario
- Monitoreo de llamadas API

## 🤝 Contribución

### Workflow de Desarrollo

1. Fork el proyecto
2. Crea una rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

### Estándares de Código

- Seguir las reglas de ESLint configuradas
- Usar TypeScript para todo el código nuevo
- Escribir tests para nuevas funcionalidades
- Documentar funciones complejas
- Usar commits semánticos

### Code Review

- Todos los PRs requieren revisión
- Tests deben pasar
- Linting debe estar limpio
- Performance debe ser considerada

## 📝 Changelog

### v2.0.0 (Actual)

- ✨ Nuevo sistema de gestión de solicitudes
- 🔧 Migración a Expo 51 y React Native 0.74
- 🎨 Rediseño completo de la interfaz
- 🔐 Mejoras en seguridad y autenticación
- 📊 Dashboard de administración avanzado
- 🚀 Optimizaciones de performance
- 🛠️ Sistema robusto de manejo de errores

## 🐛 Problemas Conocidos

- **Web**: Algunas funcionalidades nativas no están disponibles
- **iOS**: Requiere configuración adicional para notificaciones push
- **Android**: Permisos de cámara requieren configuración manual

## 📞 Soporte

### Documentación

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Supabase Documentation](https://supabase.com/docs)

### Contacto

- **Email**: soporte@elmec.com
- **Issues**: [GitHub Issues](https://github.com/tu-usuario/elmecV2-Demo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/tu-usuario/elmecV2-Demo/discussions)

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

---

**Desarrollado con ❤️ por el equipo de ElmecV2**

_¿Encontraste un bug o tienes una sugerencia? [Abre un issue](https://github.com/tu-usuario/elmecV2-Demo/issues/new) y ayúdanos a mejorar._
