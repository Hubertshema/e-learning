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
          DEFAULT: '#315b36',
          dark: '#254629',
          deep: '#1b351e',
          light: '#3e7144',
        },
        'accent-sage': {
          DEFAULT: '#7ba27a',
          light: '#a1c2a0',
          tint: '#eff4ec',
          soft: '#f6f9f5',
        },
        primary: {
          DEFAULT: '#315b36',
          foreground: '#ffffff',
          50: '#f6f9f5',
          100: '#eff4ec',
          200: '#d5e4d4',
          300: '#a1c2a0',
          400: '#7ba27a',
          500: '#558757',
          600: '#315b36',
          700: '#254629',
          800: '#1b351e',
          900: '#132615',
          950: '#0a140b',
        },
        secondary: {
          DEFAULT: '#7ba27a',
          foreground: '#2e3339',
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
