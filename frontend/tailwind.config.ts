import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1a365d',
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#243b53',
          900: '#1a365d',
        },
        secondary: {
          DEFAULT: '#d4a746',
          50: '#fcf8eb',
          100: '#f7edce',
          200: '#efdfa0',
          300: '#e5cd6e',
          400: '#dcb841',
          500: '#d4a746',
          600: '#b88a32',
          700: '#946a25',
          800: '#735222',
          900: '#604520',
        },
        accent: {
          DEFAULT: '#2c7a7b',
        }
      },
    },
  },
  plugins: [],
}
export default config
