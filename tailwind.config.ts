import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        inter: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono:  ['var(--font-mono)', 'monospace'],
      },
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        surface2: 'var(--surface2)',
        border: 'var(--border)',
        border2: 'var(--border2)',
        text: 'var(--text)',
        text2: 'var(--text2)',
        text3: 'var(--text3)',
        accent: 'var(--accent)',
        accent2: 'var(--accent2)',
        easy: 'var(--easy)',
        tempo: 'var(--tempo)',
        long: 'var(--long)',
        race: 'var(--race)',
      },
      borderRadius: {
        sm: '5px',
        DEFAULT: '7px',
        md: '8px',
        lg: '10px',
        xl: '14px',
      },
    },
  },
  plugins: [],
}

export default config
