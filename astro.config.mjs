import { defineConfig } from 'astro/config';
// Force rebuild timestamp: 2026-02-12
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel';

import react from '@astrojs/react';

export default defineConfig({
  site: 'https://riftbound-media.com',
  output: 'server',
  adapter: vercel(),
  integrations: [tailwind(), react()],
});