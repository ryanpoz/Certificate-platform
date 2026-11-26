import type { Config } from 'tailwindcss'

/**
 * Brand direction "the registrar" (see components/brand). Brand tokens are
 * named (ink, parchment, stamp...). The default gray, blue and green scales are
 * remapped to the same palette so the dashboard picks up the new colours
 * without any layout changes: gray = warm stone, blue (the old primary) =
 * stamp red, green (success/valid) = valid green.
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
        ink: { DEFAULT: '#1C1917', soft: '#44403C' },
        muted: '#6F6A64',
        parchment: '#F4EFE6',
        paper: '#FBF8F3',
        cream: '#FFFDF9',
        rule: { DEFAULT: '#E4DCD0', strong: '#C9C0B3' },
        stamp: { DEFAULT: '#8E1B1B', hover: '#6F1414' },
        brass: { DEFAULT: '#6E5424', bright: '#C9A45C' },
        valid: { DEFAULT: '#1F5C45', soft: '#E3EDE8' },
        tint: '#F7F1E6',
        gray: {
          50: '#FBF8F3',
          100: '#F4EFE6',
          200: '#E4DCD0',
          300: '#C9C0B3',
          400: '#A39A8E',
          500: '#6F6A64',
          600: '#57524C',
          700: '#44403C',
          800: '#2E2A27',
          900: '#1C1917',
          950: '#110F0E',
        },
        blue: {
          50: '#F7F1E6',
          100: '#EFE6D6',
          200: '#E0D2BC',
          300: '#C9A45C',
          400: '#B23A3A',
          500: '#A12424',
          600: '#8E1B1B',
          700: '#6F1414',
          800: '#5A1010',
          900: '#430C0C',
          950: '#2C0808',
        },
        green: {
          50: '#EEF4F1',
          100: '#E3EDE8',
          200: '#C6DCD2',
          300: '#9DC1B1',
          400: '#5E9A80',
          500: '#2F7458',
          600: '#1F5C45',
          700: '#194C39',
          800: '#143D2E',
          900: '#0F2F23',
          950: '#0A1F17',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Fraunces', 'Times New Roman', 'serif'],
        sans: ['var(--font-sans)', 'IBM Plex Sans', 'Helvetica Neue', 'sans-serif'],
      },
      borderRadius: {
        btn: '4px',
        badge: '2px',
        card: '8px',
        frame: '12px',
      },
      boxShadow: {
        paper: '0 18px 40px rgba(28, 25, 23, 0.12), 0 2px 6px rgba(28, 25, 23, 0.06)',
        soft: '0 8px 24px rgba(28, 25, 23, 0.08)',
      },
      maxWidth: {
        site: '1120px',
      },
    },
  },
  plugins: [],
}
export default config
