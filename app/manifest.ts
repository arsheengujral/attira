import type { MetadataRoute } from 'next';

/**
 * PWA manifest — makes ATTIRA installable to the home screen as a standalone
 * app (its own icon, full-screen, no browser chrome). Icons are generated on
 * the fly by the routes under /icons.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ATTIRA',
    short_name: 'ATTIRA',
    description: 'Your skin, your style — getting stronger, together.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f1ece4',
    theme_color: '#ece7df',
    categories: ['lifestyle', 'health'],
    icons: [
      { src: '/icons/192', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/512', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
