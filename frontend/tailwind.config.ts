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
        'primary-green': {
          DEFAULT: 'var(--primary-green)',
          dark: 'var(--primary-green-dark)',
          deep: 'var(--primary-green-deep)',
          light: 'var(--primary-green-light)',
        },
        'accent-sage': {
          DEFAULT: 'var(--accent-sage)',
          light: 'var(--accent-sage-light)',
          tint: 'var(--accent-sage-tint)',
          soft: 'var(--accent-sage-soft)',
        },
        primary: {
          DEFAULT: '#3d6748',
          foreground: '#ffffff',
          50: '#f4f8f5',
          100: '#edf4ef',
          200: '#a4c6a6',
          300: '#88ad8a',
          400: '#52825e',
          500: '#52825e',
          600: '#3d6748',
          700: '#2c4e36',
          800: '#1e3825',
          900: '#15291b',
          950: '#0d1911',
        },
        secondary: {
          DEFAULT: '#88ad8a',
          foreground: '#1b231e',
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
