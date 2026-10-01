import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-main)', 'Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['var(--font-display)', 'Poppins', 'var(--font-main)', 'sans-serif'],
        heading: ['var(--font-display)', 'Poppins', 'var(--font-main)', 'sans-serif'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        // Official Brand Palette
        navy: {
          DEFAULT: '#012970',
          dark: '#011b4a',
          deep: '#011538',
          light: '#0a3a99',
        },
        blue: {
          DEFAULT: '#006EF3',
          hover: '#005ed1',
          light: '#3b8ff7',
          tint: '#F3F7FC',
        },
        gold: {
          DEFAULT: '#F5B400',
          hover: '#dba100',
          light: '#ffc83b',
          tint: '#fef8e7',
        },
        'brand-navy': '#012970',
        'brand-blue': '#006EF3',
        'brand-gold': '#F5B400',
        'brand-light-blue': '#F3F7FC',
        'brand-text': '#172033',
        'brand-gray': '#667085',
        // Legacy Compatibility Tokens mapped to Brand Palette
        'primary-green': {
          DEFAULT: '#012970',
          dark: '#011b4a',
          deep: '#011538',
          light: '#006EF3',
        },
        'accent-sage': {
          DEFAULT: '#006EF3',
          light: '#3b8ff7',
          tint: '#F3F7FC',
          soft: '#F3F7FC',
        },
        primary: {
          DEFAULT: '#012970',
          foreground: '#ffffff',
          50: '#F3F7FC',
          100: '#e1eefe',
          200: '#bfdcfe',
          300: '#93c2fd',
          400: '#60a1fa',
          500: '#006EF3',
          600: '#0254c2',
          700: '#013e94',
          800: '#012970',
          900: '#011b4a',
          950: '#011538',
        },
        secondary: {
          DEFAULT: '#F3F7FC',
          foreground: '#172033',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out forwards',
        'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
