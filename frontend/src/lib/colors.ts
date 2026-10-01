/**
 * LinguaChris Academy Design System Brand Colors
 * Extracted from official logo palette
 */

export const BRAND_COLORS = {
  // Official Core Palette
  navy: {
    DEFAULT: '#012970',
    deep: '#011b4a',
    light: '#0a3d99',
    50: '#f0f5fc',
    100: '#dbe7f8',
    200: '#bcd4f2',
    500: '#0a3d99',
    600: '#012970',
    700: '#01225d',
    800: '#011b4a',
    900: '#011438',
  },

  blue: {
    DEFAULT: '#006EF3',
    hover: '#005ed1',
    light: '#338bff',
    50: '#eef6ff',
    100: '#d9ebff',
    500: '#006EF3',
  },

  gold: {
    DEFAULT: '#F5B400',
    light: '#fedb66',
    dark: '#c49000',
  },

  lightBlue: {
    DEFAULT: '#F3F7FC',
    tint: '#eaf1fa',
  },

  // Text Colors
  text: {
    primary: '#172033',
    body: '#172033',
    gray: '#667085',
    muted: '#667085',
    light: '#8fa0b5',
    inverse: '#FFFFFF',
  },

  // Background & Surface
  surface: {
    white: '#FFFFFF',
    lightBlue: '#F3F7FC',
    card: '#FFFFFF',
    border: '#E2E8F0',
  },

  // Backwards compatibility primary mappings
  primary: {
    DEFAULT: '#012970',
    dark: '#011b4a',
    light: '#006EF3',
    accent: '#F5B400',
    50: '#f0f5fc',
    100: '#dbe7f8',
    200: '#bcd4f2',
    300: '#8bb6eb',
    400: '#4d8fe4',
    500: '#006EF3',
    600: '#012970',
    700: '#01225d',
    800: '#011b4a',
    900: '#011438',
  },
} as const;

export type BrandColorTheme = typeof BRAND_COLORS;

