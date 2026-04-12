# Documentación de QA - ELMEC App

Esta carpeta contiene toda la documentación relacionada con el proceso de Quality Assurance (QA) de la aplicación ELMEC.

## Archivos

### 📄 Documentos principales

- **`qa.pdf`** - Documento original de QA con screenshots y lista de issues
- **`QA_PLAN.md`** - Plan detallado de todas las tareas de QA organizadas por prioridad
- **`PROGRESS.md`** - Checklist de progreso actualizable para tracking de tareas completadas
- **`README.md`** - Este archivo

### 🎨 Assets de diseño

Los assets de diseño están almacenados en `/assets/images/branding/`:

- `logo.png` - Logo oficial de ELMEC
- `colores.jpg` - Paleta de colores corporativa
- `coloresapp.jpg` - Paleta de colores para la aplicación

### 🎨 Constantes de colores

Los colores oficiales están documentados en:

- `/constants/colors.ts` - Definiciones de colores para uso en la app

## Paleta de Colores

```typescript
// Colores principales
primary: '#202B52'; // Azul oscuro - Pantone 533 C
primaryMedium: '#335686'; // Azul medio - Pantone 653 C
primaryLight: '#95C3ED'; // Azul claro - Pantone 283 C

// Neutrales
white: '#FFFFFF';
black: '#000000';
gray: '#A8B5BD'; // Cool Gray 5 C
```

## Cómo usar esta documentación

### Para continuar el trabajo en una nueva sesión:

1. **Lee el progreso actual:**

   ```bash
   cat docs/QA/PROGRESS.md
   ```

2. **Revisa el plan completo:**

   ```bash
   cat docs/QA/QA_PLAN.md
   ```

3. **Consulta el PDF original si necesitas más contexto:**
   - Ubicación: `docs/QA/qa.pdf`

4. **Actualiza PROGRESS.md al completar tareas:**
   - Marca las tareas como completadas con [x]
   - Actualiza las fechas de inicio y fin
   - Actualiza los porcentajes de completado

### Estructura de Sprints

**Sprint 1: Problemas Críticos** (Prioridad Alta)

- Arreglar pantallas en standby
- Corregir botones sin funcionalidad

**Sprint 2: Limpieza de Datos** (Prioridad Media)

- Ajustar directorio a 15 contactos
- Actualizar opciones de formularios
- Limpiar datos de agentes

**Sprint 3: Mejoras y Diseño** (Prioridad Media-Alta)

- Implementar funcionalidades faltantes
- Agregar elementos visuales
- Integrar fotos de vendedores

**Sprint 4: Sincronización** (Prioridad Alta)

- Sincronizar conversaciones entre plataformas

## Links Útiles

### Assets externos (Google Drive)

- **Fotos de vendedores:** https://drive.google.com/drive/folders/1WOi5J9gcRSCnmIQoWVntFLR29HTwmcMX
- **Elementos de diseño adicionales:** https://drive.google.com/drive/folders/1_4UMfLY7PuXYedITp1E3qTshK6IXXOVk

## Estado Actual

**Total de tareas:** 18
**Completadas:** 0
**Pendientes:** 18
**Progreso general:** 0%

**Última actualización:** 2025-10-21

---

## Próxima sesión: ¿Por dónde empezar?

1. Lee `PROGRESS.md` para ver qué está completado
2. Revisa `QA_PLAN.md` para ver el siguiente sprint
3. Comienza con las tareas del Sprint actual
4. Actualiza `PROGRESS.md` al terminar cada tarea
