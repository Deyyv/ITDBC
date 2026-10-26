/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Karla', 'Segoe UI', 'Arial', 'sans-serif'],
        disp: ['Fraunces', 'Georgia', 'Times New Roman', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Cascadia Mono', 'Consolas', 'monospace'],
      },
      fontSize: {
        /** Smallest size allowed anywhere in the UI (11px). */
        micro: ['0.6875rem', { lineHeight: '1rem' }],
      },
      colors: {
        /* Legacy names, remapped to the dashboard palette so every route looks like one product. */
        follaje: '#102C20',
        sombra: '#102C20',
        hoja: '#137A3E',
        lavada: '#F1F2EC',
        fibra: '#DCE8D9',
        cascara: '#137A3E',
        blanco: '#F7FAF4',
        card: '#FFFFFF',
        tinta: '#10201A',
        suave: '#566559',
        linea: 'rgba(16, 32, 26, 0.12)',
        alerta: '#A63A2B',
        dash: {
          cement: '#F1F2EC',
          paper: '#FFFFFF',
          ink: '#10201A',
          forest: '#102C20',
          forest2: '#173A2A',
          signal: '#3ADD7F',
          signalDeep: '#1F9D5B',
          /** Signal green dark enough for text on light surfaces (AA). */
          signalInk: '#137A3E',
          lime: '#C8F36B',
          sage: '#DCE8D9',
          muted: '#566559',
          line: 'rgba(16, 32, 26, 0.12)',
          console: '#0A1A12',
          consoleText: '#D7E6DC',
        },
        /** Tag colours of the serial monitor (all AA on `dash.console`). */
        log: {
          esp32: '#3ADD7F',
          hx711: '#C8F36B',
          servo: '#FBBF24',
          presence: '#7DD3FC',
          tof: '#C4B5FD',
          cupon: '#F9A8D4',
        },
      },
      boxShadow: {
        suave: '0 6px 24px rgba(16, 40, 28, 0.08)',
        fuerte: '0 12px 28px rgba(16, 40, 28, 0.18)',
        float: '0 18px 40px -22px rgba(16, 44, 32, 0.45)',
      },
      maxWidth: {
        site: '1120px',
      },
      animation: {
        breath: 'breath 3.2s ease-in-out infinite',
        'pulse-dot': 'pulse-dot 2.2s ease-in-out infinite',
        'toast-in': 'toast-in 0.25s ease',
        'dash-scan': 'dash-scan 2.8s ease-in-out infinite',
        'dash-shimmer': 'dash-shimmer 1.8s linear infinite',
        'dash-draw': 'dash-draw 1.1s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
      keyframes: {
        breath: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.55' },
          '50%': { transform: 'scale(1.07)', opacity: '1' },
        },
        'pulse-dot': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(31, 157, 91, 0.5)' },
          '50%': { boxShadow: '0 0 0 6px rgba(31, 157, 91, 0)' },
        },
        'toast-in': {
          from: { opacity: '0', transform: 'translate(-50%, 12px)' },
          to: { opacity: '1', transform: 'translate(-50%, 0)' },
        },
        'dash-scan': {
          '0%, 12%': { top: '8%', opacity: '0' },
          '22%': { opacity: '0.9' },
          '78%': { opacity: '0.9' },
          '100%': { top: '92%', opacity: '0' },
        },
        'dash-shimmer': {
          from: { backgroundPosition: '200% 0' },
          to: { backgroundPosition: '-200% 0' },
        },
        'dash-draw': {
          from: { strokeDashoffset: '1' },
          to: { strokeDashoffset: '0' },
        },
      },
    },
  },
  plugins: [],
}
