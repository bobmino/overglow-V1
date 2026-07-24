/** @type {import('tailwindcss').Config} */
import tailwindcssRtl from 'tailwindcss-rtl';
import tailwindcssAnimate from 'tailwindcss-animate';

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Noto Sans Arabic', 'sans-serif'],
        heading: ['Outfit', 'Noto Sans Arabic', 'sans-serif'],
        arabic: ['Noto Sans Arabic', 'Inter', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        secondary: {
          500: '#fbbf24',
          600: '#f59e0b',
        },
        // [TASK-10] Design tokens aliases
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        border: 'var(--color-border)',
      },
      screens: {
        xs: '475px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
    },
  },
  // [TASK-16] RTL variants (rtl: / ltr:) — with Tailwind 3.4 logical utilities (ms/me/ps/pe)
  plugins: [tailwindcssRtl, tailwindcssAnimate],
};
