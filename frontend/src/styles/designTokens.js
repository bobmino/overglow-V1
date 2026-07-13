/**
 * [TASK-10] Design tokens Overglow Trip
 * Source de vérité JS — miroir des CSS variables dans index.css
 */
export const designTokens = {
  color: {
    primary: '#059669', // primary-600
    primaryDark: '#047857', // primary-700
    secondary: '#f59e0b', // amber-500
    accent: '#10b981', // primary-500
    background: '#f8fafc', // slate-50
    surface: '#ffffff',
    border: '#e2e8f0', // slate-200
    text: '#1e293b', // slate-800
    muted: '#64748b', // slate-500
  },
  radius: {
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
  },
  shadow: {
    card: '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08)',
    elevated: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
  },
  font: {
    sans: "'Inter', sans-serif",
    heading: "'Outfit', sans-serif",
  },
};

export default designTokens;
