import type { Config } from 'tailwindcss';

/**
 * ATTIRA uses a scoped, hand-authored design system (see app/globals.css, all
 * tokens under `.att-root`). Tailwind is wired up for future modules (Style,
 * Hair, Career…) that will plug into the same shell — the Skin screens
 * themselves lean on the design tokens, not utilities.
 */
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['var(--font-cormorant)', 'Cormorant Garamond', 'serif'],
        sans: ['var(--font-figtree)', 'Figtree', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
