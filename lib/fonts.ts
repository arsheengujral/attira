import { Cormorant_Garamond, Figtree } from 'next/font/google';

// Display / headers — an elegant, warm, editorial serif. The hero numbers
// (skin score, streak count, "14 DAYS COMPLETE") are treated as jewellery.
export const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

// Body / UI — a clean humanist sans for every functional string (labels,
// buttons, step descriptions). The typeface from the approved Skincare v2 design.
export const figtree = Figtree({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-figtree',
  display: 'swap',
});
