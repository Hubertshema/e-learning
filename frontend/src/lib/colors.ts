/**
 * LinguaChris Academy Design System Brand Colors
 * Extracted with pixel precision from real-logo.png
 */

export const BRAND_COLORS = {
  // Primary Forest Green Palette
  primary: {
    DEFAULT: '#315B36',
    dark: '#254629',
    deep: '#1B351E',
    light: '#3E7144',
    50: '#F6F9F5',
    100: '#EFF4EC',
    200: '#D5E4D4',
    300: '#A1C2A0',
    400: '#7BA27A',
    500: '#558757',
    600: '#315B36',
    700: '#254629',
    800: '#1B351E',
    900: '#132615',
  },

  // Sage Leaf Green Accent
  sage: {
    DEFAULT: '#7BA27A',
    light: '#A1C2A0',
    tint: '#EFF4EC',
    soft: '#F6F9F5',
    border: '#E2EBE2',
  },

  // Charcoal Slate Text Colors
  text: {
    primary: '#2E3339',
    body: '#3D4247',
    muted: '#5A5E63',
    light: '#8C929A',
    inverse: '#FFFFFF',
  },

  // Background & Surface
  surface: {
    white: '#FFFFFF',
    cream: '#FBFDFB',
    tint: '#EFF4EC',
    soft: '#F6F9F5',
    border: '#E2EBE2',
  },
} as const;

export type BrandColorTheme = typeof BRAND_COLORS;
