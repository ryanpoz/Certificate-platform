import type { Config } from 'tailwindcss'

/**
 * Brand direction "Poster ink" (option C of the fun direction; see
 * components/brand). Brand tokens are named (ink, cheer, sun, mint...). The
 * default gray, blue and green scales are remapped to the same palette so the
 * dashboard picks up the brand without layout changes: gray = ink neutrals,
 * blue (the old primary) = cheer raspberry, green (success) = teal.
 */
const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#17141F', soft: '#3E3851' },
        // Celebration tokens are CSS variables (app/globals.css) so a rebrand only edits the theme
        celebrate: {
          DEFAULT: 'var(--celebrate-accent)',
          hover: 'var(--celebrate-accent-hover)',
          glow: 'var(--celebrate-glow)',
          surface: 'var(--celebrate-surface)',
          ink: 'var(--celebrate-ink)',
        },
        muted: '#5C5668',
        /** Light page (option C) */
        page: '#FFFDF8',
        paper: '#FFFFFF',
        /** Cream type on ink */
        cream: '#FFF6EF',
        /** Lede and fine print on ink */
        haze: { DEFAULT: '#DAD4E4', dim: '#B8B2C4' },
        rule: { DEFAULT: '#E8E2D8', strong: '#D9CFC4' },
        cheer: { DEFAULT: '#D1185C', hover: '#B0124D', soft: '#FDE8F0', tint: '#FDEFF4' },
        gold: { DEFAULT: '#8A5408', bright: '#FFC44D' },
        teal: { DEFAULT: '#0C6B5C', soft: '#E6F4F0' },
        sun: { DEFAULT: '#FFD93D', soft: '#FFE9A0', pale: '#FFF3C8' },
        mint: '#B2F0C8',
        periwinkle: '#6B6FD6',
        gray: {
          50: '#FAF8F5',
          100: '#F3F0EC',
          200: '#E8E2D8',
          300: '#D9CFC4',
          400: '#A59FB0',
          500: '#5C5668',
          600: '#4A4458',
          700: '#3E3851',
          800: '#2A2536',
          900: '#17141F',
          950: '#0E0C14',
        },
        blue: {
          50: '#FDF2F6',
          100: '#FDE8F0',
          200: '#FAC7DA',
          300: '#F497B9',
          400: '#E5508A',
          500: '#DB2A6E',
          600: '#D1185C',
          700: '#B0124D',
          800: '#8E0F3F',
          900: '#6E0C31',
          950: '#45071F',
        },
        green: {
          50: '#EEF8F5',
          100: '#E6F4F0',
          200: '#C3E6DC',
          300: '#8FD0BE',
          400: '#4FAE95',
          500: '#1E8A73',
          600: '#0C6B5C',
          700: '#0A594C',
          800: '#08473D',
          900: '#06362E',
          950: '#03221D',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Bricolage Grotesque', 'Avenir Next', 'sans-serif'],
        sans: ['var(--font-sans)', 'Figtree', 'Helvetica Neue', 'sans-serif'],
      },
      borderRadius: {
        btn: '999px',
        badge: '999px',
        card: '16px',
        frame: '24px',
      },
      keyframes: {
        drift: {
          '0%, 100%': { transform: 'translate(0, 0) rotate(var(--r, 0deg))' },
          '50%': { transform: 'translate(0, -7px) rotate(var(--r, 0deg))' },
        },
        'spark-pop': {
          '0%': { opacity: '0', transform: 'scale(0.4)' },
          '70%': { opacity: '1', transform: 'scale(1.08)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'rise-in': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'cert-reveal': {
          '0%': { opacity: '0', transform: 'translateY(24px) scale(0.94) rotate(-1.5deg)' },
          '60%': { opacity: '1', transform: 'translateY(-4px) scale(1.01) rotate(0.3deg)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1) rotate(0)' },
        },
        'celebrate-pop': {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '70%': { opacity: '1', transform: 'scale(1.04)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        drift: 'drift 7s ease-in-out infinite',
        'spin-slow': 'spin 40s linear infinite',
        'spark-pop': 'spark-pop 500ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'rise-in': 'rise-in 600ms cubic-bezier(0.22, 1, 0.36, 1) 350ms both',
        'cert-reveal': 'cert-reveal 900ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'celebrate-pop': 'celebrate-pop 600ms cubic-bezier(0.22, 1, 0.36, 1) 150ms both',
      },
      boxShadow: {
        paper: '0 22px 50px rgba(23, 20, 31, 0.12), 0 2px 8px rgba(23, 20, 31, 0.06)',
        soft: '0 10px 30px rgba(23, 20, 31, 0.08)',
        cheer: '0 14px 32px rgba(209, 24, 92, 0.28)',
        sticker: '0 24px 60px rgba(0, 0, 0, 0.45), 0 2px 8px rgba(0, 0, 0, 0.25)',
      },
      maxWidth: {
        site: '1120px',
      },
    },
  },
  plugins: [],
}
export default config
