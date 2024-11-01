import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    colors: {
      palette: {
        love: 'rgb(var(--palette-love))',
        gold: 'rgb(var(--palette-gold))',
        rose: 'rgb(var(--palette-rose))',
        pine: 'rgb(var(--palette-pine))',
        foam: 'rgb(var(--palette-foam))',
        iris: 'rgb(var(--palette-iris))',
      },
      base: 'rgb(var(--palette-base))',
      surface: 'rgb(var(--palette-surface))',
      overlay: 'rgb(var(--palette-overlay))',
      muted: 'rgb(var(--palette-muted))',
      subtle: 'rgb(var(--palette-subtle))',
      text: 'rgb(var(--palette-text))',
      highlight: {
        low: 'rgb(var(--palette-highlight-low))',
        med: 'rgb(var(--palette-highlight-med))',
        high: 'rgb(var(--palette-highlight-high))',
      },
      quote: {
        odd: 'rgb(var(--palette-overlay))',
        even: 'rgb(var(--palette-surface))',
      },
      border: 'rgb(var(--palette-highlight-high))',
      error: 'rgb(var(--palette-love))',
      warn: 'rgb(var(--palette-gold))',
      hint: 'rgb(var(--palette-rose))',
      link: 'rgb(var(--palette-foam))',
      'link-visited': 'rgb(var(--palette-pine))',
      'focus-visible': 'rgb(var(--palette-iris))',
    },
    fontFamily: {
      sans: ['IBM Plex Sans', 'Noto Sans SC', 'sans-serif'],
      serif: ['IBM Plex Serif', 'Noto Serif SC', 'serif'],
      mono: ['IBM Plex Mono', 'Noto Mono', 'monospace'],
    },
    fontSize: {
      sm: 'var(--font-size-s)',
      base: 'var(--font-size-m)',
      lg: 'var(--font-size-l)',
      xl: 'var(--font-size-xl)',
      '2xl': 'var(--font-size-2xl)',
      '3xl': 'var(--font-size-3xl)',
      '4xl': 'var(--font-size-4xl)',
    },
    screens: {
      sm: '43rem', // article(40rem) + 2 * page-horizontal(1.5rem): 688px
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      maxWidth: {
        article: '40rem',
      },
      spacing: {
        'page-vertical': '1rem',
        'page-horizontal': '1.5rem',
        '2xs': '0.25rem' /* 4px */,
        xs: '0.5rem' /* 8px */,
        s: '0.75rem' /* 12px */,
        m: '1rem' /* 16px */,
        l: '1.5rem' /* 24px */,
        xl: '2rem' /* 32px */,
        '2xl': '3rem' /* 48px */,
        '3xl': '4rem' /* 64px */,
        '4xl': '6rem' /* 96px */,
        '5xl': '8rem' /* 128px */,
      },
    },
  },
  plugins: [],
} satisfies Config;
