import type { Metadata, Viewport } from 'next';
import { cormorant, figtree } from '@/lib/fonts';
import { PWARegister } from '@/components/PWARegister';
import './globals.css';

export const metadata: Metadata = {
  title: 'ATTIRA — Your skin, your style, getting stronger',
  description:
    'ATTIRA is a calm, personal companion that learns you across every part of your life — starting with your skin and your style, and remembers.',
  applicationName: 'ATTIRA',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ATTIRA',
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#ece7df',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${figtree.variable}`}>
      <body>
        {children}
        <PWARegister />
      </body>
    </html>
  );
}
