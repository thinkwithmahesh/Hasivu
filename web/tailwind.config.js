/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // HASIVU Brand Colors
        hasivu: {
          orange: {
            50: '#FFF7ED',
            100: '#FFEDD5',
            200: '#FED7AA',
            300: '#FDBA74',
            400: '#FB923C',
            500: '#FF6B35', // Main orange
            600: '#EA580C',
            700: '#C2410C',
            800: '#9A3412',
            900: '#7C2D12',
          },
          green: {
            50: '#E8F5E8',
            100: '#C8E6C8',
            200: '#A5D6A7',
            300: '#81C784',
            400: '#66BB6A',
            500: '#4CAF50', // Main green
            600: '#43A047',
            700: '#388E3C',
            800: '#2E7D32',
            900: '#1B5E20',
          },
          blue: {
            50: '#E3F2FD',
            100: '#BBDEFB',
            200: '#90CAF9',
            300: '#64B5F6',
            400: '#42A5F5',
            500: '#2196F3', // Main blue
            600: '#1E88E5',
            700: '#1976D2',
            800: '#1565C0',
            900: '#0D47A1',
          },
        },
        // Hasivu Teal — trust, freshness, hygiene
        'hasivu-teal': {
          50: '#E6FAF7',
          100: '#B3F0E8',
          200: '#80E6D9',
          300: '#4DDCCA',
          400: '#2EC4B6',
          500: '#2EC4B6',
          600: '#25A89D',
          700: '#1C8C84',
          800: '#13706B',
          900: '#0A5452',
        },
        // Hasivu Accent — warmth, nutrition, sunlight
        'hasivu-accent': {
          50: '#FFF9E6',
          100: '#FFEFB3',
          200: '#FFE580',
          300: '#FFDB4D',
          400: '#FFD166',
          500: '#FFD166',
          600: '#E6B84D',
          700: '#CC9F33',
          800: '#B3861A',
          900: '#996D00',
        },
        // Hasivu Success — healthy, fresh
        'hasivu-success': {
          50: '#E6FFF5',
          100: '#B3FFE0',
          200: '#80FFCC',
          300: '#4DFFB8',
          400: '#06D6A0',
          500: '#06D6A0',
          600: '#05B888',
          700: '#049A70',
          800: '#037C58',
          900: '#025E40',
        },
        // Hasivu Danger — alerts without anxiety
        'hasivu-danger': {
          50: '#FFF0F3',
          100: '#FFD1DB',
          200: '#FFB2C3',
          300: '#FF93AB',
          400: '#EF476F',
          500: '#EF476F',
          600: '#D63D62',
          700: '#BD3355',
          800: '#A42948',
          900: '#8B1F3B',
        },
        // Parent-mobile & redesign shell — mirrors `src/design-system/tokens.ts`
        // ─── HASIVU UNIFIED DESIGN TOKENS ───
        'hasivu-neutral': {
          50: '#FAF9F7',
          100: '#F2EFE9',
          200: '#E4DFD6',
          400: '#9E9589',
          600: '#5C554A',
          800: '#2A2520',
          900: '#141210',
        },
        'hasivu-surface': { 1: '#FFFFFF', 2: '#F2EFE9', 3: '#E4DFD6' },
        'hasivu-text': {
          primary: '#141210',
          secondary: '#5C554A',
          tertiary: '#9E9589',
          inverse: '#FFFFFF',
        },
        'hasivu-semantic': {
          success: '#22C55E',
          warning: '#F59E0B',
          danger: '#EF4444',
          info: '#3B82F6',
        },
        // Backward-compat alias (TODO: migrate pm-* usage then remove)
        pm: {
          page: { bg: '#FAF9F7' },
          primary: {
            50: '#FFF8F0',
            100: '#FFECD4',
            200: '#FFD9A8',
            400: '#FF9A3C',
            600: '#E07020',
            800: '#7A3A08',
            900: '#3D1C04',
          },
          secondary: { 50: '#F0FAF4', 400: '#3CAF6A', 600: '#207040' },
          neutral: {
            50: '#FAF9F7',
            100: '#F2EFE9',
            200: '#E4DFD6',
            400: '#9E9589',
            600: '#5C554A',
            800: '#2A2520',
            900: '#141210',
          },
          surface: { 1: '#FFFFFF', 2: '#F2EFE9', 3: '#E4DFD6' },
          text: {
            primary: '#141210',
            secondary: '#5C554A',
            tertiary: '#9E9589',
            inverse: '#FFFFFF',
          },
          semantic: { success: '#22C55E', warning: '#F59E0B', danger: '#EF4444', info: '#3B82F6' },
        },
        // Neutral “ink” palette for typography (softer than pure black)
        ink: {
          50: '#F8FAFC',
          100: '#EEF2F6',
          200: '#E3E8EF',
          300: '#CDD5DF',
          400: '#98A2B3',
          500: '#667085',
          600: '#475467',
          700: '#344054',
          800: '#1F2A37',
          900: '#101828',
          950: '#0B1220',
        },
        // shadcn/ui system colors
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
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
      spacing: {
        'touch-target': '48px',
      },
      minWidth: {
        'touch-target': '48px',
      },
      minHeight: {
        'touch-target': '48px',
      },
      fontFamily: {
        sans: ['var(--font-body)', 'Nunito', 'system-ui', 'sans-serif'],
        display: ['var(--font-hero)', 'Instrument Serif', 'Georgia', 'serif'],
        /** UI chrome: nav labels, tables, stats, form labels */
        ui: ['var(--font-ui)', 'DM Sans', 'system-ui', 'sans-serif'],
        /** Marketing / hero only */
        hero: ['var(--font-hero)', 'Instrument Serif', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        soft: '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'warm-sm': '0 1px 3px rgba(255, 107, 53, 0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'warm-md': '0 4px 12px rgba(255, 107, 53, 0.08), 0 2px 4px rgba(0,0,0,0.04)',
        'warm-lg': '0 12px 32px rgba(255, 107, 53, 0.12), 0 4px 8px rgba(0,0,0,0.04)',
        'glow-teal': '0 0 24px rgba(46, 196, 182, 0.15)',
        'glow-orange': '0 0 20px rgba(255, 107, 53, 0.5)',
        'glow-green': '0 0 20px rgba(76, 175, 80, 0.5)',
        'glow-blue': '0 0 20px rgba(33, 150, 243, 0.5)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'bounce-delayed': {
          '0%, 80%, 100%': { transform: 'scale(0)' },
          '40%': { transform: 'scale(1)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(255, 107, 53, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(255, 107, 53, 0.8)' },
        },
        'rfid-scan': {
          '0%': { transform: 'scaleY(0)', opacity: '0' },
          '50%': { transform: 'scaleY(1)', opacity: '1' },
          '100%': { transform: 'scaleY(0)', opacity: '0' },
        },
        marquee: {
          from: { transform: 'translateX(0%)' },
          to: { transform: 'translateX(-100%)' },
        },
        blob: {
          '0%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
          '33%': {
            transform: 'translate(30px, -50px) scale(1.1)',
          },
          '66%': {
            transform: 'translate(-20px, 20px) scale(0.9)',
          },
          '100%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        shimmer: 'shimmer 2s ease-in-out infinite',
        'bounce-delayed-1': 'bounce-delayed 1.4s ease-in-out infinite 0.16s',
        'bounce-delayed-2': 'bounce-delayed 1.4s ease-in-out infinite 0.32s',
        'fade-in-up': 'fade-in-up 0.5s ease-out',
        'pulse-glow': 'pulse-glow 2s infinite',
        'rfid-scan': 'rfid-scan 1.5s ease-in-out',
        marquee: 'marquee 25s linear infinite',
        blob: 'blob 7s infinite',
        'animation-delay-2000': 'blob 7s infinite 2s',
        'animation-delay-4000': 'blob 7s infinite 4s',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
