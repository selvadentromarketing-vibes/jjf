// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

const LATIN = 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD';

export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || 'https://jjfcreando.com',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  i18n: {
    locales: ['es', 'en'],
    defaultLocale: 'es',
    routing: { prefixDefaultLocale: true, redirectToDefaultLocale: false },
  },
  integrations: [
    sitemap({ filter: (page) => !/\/(gracias|thank-you)\/$/.test(page) && !/\/404/.test(page) }),
  ],
  vite: { plugins: [tailwindcss()] },
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Instrument Serif',
      cssVariable: '--font-display',
      fallbacks: ['Georgia', 'Times New Roman', 'serif'],
      options: {
        variants: [
          { weight: 400, style: 'normal', src: ['./src/assets/fonts/instrument-serif-latin-400-normal.woff2'], unicodeRange: [LATIN] },
          { weight: 400, style: 'italic', src: ['./src/assets/fonts/instrument-serif-latin-400-italic.woff2'], unicodeRange: [LATIN] },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'Instrument Sans',
      cssVariable: '--font-text',
      fallbacks: ['system-ui', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
      options: {
        variants: [
          { weight: '400 700', style: 'normal', src: ['./src/assets/fonts/instrument-sans-latin-wght-normal.woff2'], unicodeRange: [LATIN] },
          { weight: '400 700', style: 'italic', src: ['./src/assets/fonts/instrument-sans-latin-wght-italic.woff2'], unicodeRange: [LATIN] },
        ],
      },
    },
  ],
});
