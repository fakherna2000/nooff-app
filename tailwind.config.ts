import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fdfaf1',
          100: '#faf3dd',
          200: '#f4e7bb',
          300: '#ecd992',
          400: '#e2c86b',
          500: '#d4af37',
          600: '#c19b2e',
          700: '#a17f24',
          800: '#83661d',
          900: '#6a521a',
        },
        accent: {
          50: '#fbf7f1',
          100: '#f4ebdc',
          200: '#e8d5b7',
          300: '#d9b98b',
          400: '#c99a5f',
          500: '#b98343',
          600: '#a06c35',
          700: '#83552e',
          800: '#6b462a',
          900: '#593b26',
        },
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
        },
        danger: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
        },
      },
      fontFamily: {
        sans: ['Tajawal', 'Cairo', 'system-ui', 'sans-serif'],
      },
      container: {
        center: true,
        padding: '1rem',
      },
    },
  },
  plugins: [],
};

export default config;
