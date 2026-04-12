/**
 * ELMEC Brand Colors
 *
 * Paleta de colores oficial basada en las guías de diseño de ELMEC
 * Fuente: assets/images/branding/colores.jpg y coloresapp.jpg
 * Actualizado: 2025-10-21
 */

export const BRAND_COLORS = {
  // Colores principales
  primary: '#202B52', // Azul oscuro - Pantone 533 C
  primaryMedium: '#335686', // Azul medio - Pantone 653 C
  primaryLight: '#95C3ED', // Azul claro - Pantone 283 C

  // Neutrales
  white: '#FFFFFF',
  black: '#000000',
  gray: '#A8B5BD', // Cool Gray 5 C

  // Aliases para uso en la app
  background: '#FFFFFF',
  surface: '#F9FAFB', // Superficie para cards y modals
  text: '#202B52',
  textPrimary: '#111827', // Texto principal
  textSecondary: '#A8B5BD',
  border: '#A8B5BD',

  // Estados
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#F44336',
  info: '#95C3ED',
} as const;

/**
 * Información técnica de colores
 */
export const COLOR_SPECS = {
  primary: {
    hex: '#202B52',
    rgb: { r: 32, g: 43, b: 82 },
    cmyk: { c: 61, m: 48, y: 0, k: 68 },
    pantone: '533 C',
  },
  primaryMedium: {
    hex: '#335686',
    rgb: { r: 51, g: 86, b: 134 },
    cmyk: { c: 62, m: 36, y: 0, k: 47 },
    pantone: '653 C',
  },
  primaryLight: {
    hex: '#95C3ED',
    rgb: { r: 149, g: 195, b: 237 },
    cmyk: { c: 37, m: 18, y: 0, k: 7 },
    pantone: '283 C',
  },
  gray: {
    hex: '#A8B5BD',
    rgb: { r: 168, g: 181, b: 189 },
    cmyk: { c: 11, m: 4, y: 0, k: 26 },
    pantone: 'Cool Gray 5 C',
  },
} as const;

export default BRAND_COLORS;
