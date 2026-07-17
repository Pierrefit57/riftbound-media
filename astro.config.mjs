import { defineConfig } from 'astro/config';
// Force rebuild timestamp: 2026-02-12
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel';

import react from '@astrojs/react';

import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.riftbound-media.fr',
  output: 'server',
  adapter: vercel(),
  integrations: [tailwind(), react(), sitemap()],
});