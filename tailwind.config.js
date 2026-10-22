/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Karla', 'Segoe UI', 'Arial', 'sans-serif'],
        disp: ['Fraunces', 'Georgia', 'Times New Roman', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Consolas', 'monospace'],
      },
      colors: {
        follaje: '#1C3B2C',
        sombra: '#10281C',
        hoja: '#47724F',
        lavada: '#EDF2E8',
        fibra: '#E6D9B8',
        cascara: '#C9993B',
        blanco: '#F7FAF4',
        card: '#FFFFFF',
        tinta: '#152B1E',
        suave: '#4C5F50',
        linea: 'rgba(28, 59, 44, 0.14)',
        alerta: '#A63A2B',
        dash: {
          cement: '#F1F2EC',
          paper: '#FFFFFF',
          ink: '#10201A',
          forest: '#102C20',
          forest2: '#173A2A',
          signal: '#3ADD7F',
          signalDeep: '#1F9D5B',
          lime: '#C8F36B',
          sage: '#DCE8D9',
          muted: '#5F6F64',
          line: 'rgba(16, 32, 26, 0.12)',
        },
      },
      boxShadow: {
        suave: '0 6px 24px rgba(16, 40, 28, 0.08)',
        fuerte: '0 12px 28px rgba(16, 40, 28, 0.14)',
        oro: '0 18px 40px rgba(201, 153, 59, 0.35)',
        header: '0 12px 28px rgba(16, 40, 28, 0.35)',
      },
      maxWidth: {
        site: '1120px',
      },
      animation: {
        breath: 'breath 3.2s ease-in-out infinite',
        'pulse-dot': 'pulse-dot 2.2s ease-in-out infinite',
        drift: 'drift 8s ease-in-out infinite alternate',
        'toast-in': 'toast-in 0.25s ease',
        'dash-rise': 'dash-rise 0.55s cubic-bezier(0.22, 1, 0.36, 1) both',
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
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(201, 153, 59, 0.55)' },
          '50%': { boxShadow: '0 0 0 6px rgba(201, 153, 59, 0)' },
        },
        drift: {
          from: { transform: 'translateY(0) rotate(-0.8deg)' },
          to: { transform: 'translateY(-12px) rotate(0.8deg)' },
        },
        'toast-in': {
          from: { opacity: '0', transform: 'translate(-50%, 12px)' },
          to: { opacity: '1', transform: 'translate(-50%, 0)' },
        },
        'dash-rise': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
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