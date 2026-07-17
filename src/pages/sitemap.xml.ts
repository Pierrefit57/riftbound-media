import type { APIRoute } from 'astro';
import { supabase } from '../lib/supabase';
import { articleUrl } from '../lib/articleUrl';

export const prerender = false;

export const GET: APIRoute = async () => {
  const siteUrl = 'https://www.riftbound-media.fr';

  // Read-only SELECT — no writes to Supabase
  const { data: articles } = await supabase
    .from('articles')
    .select('slug, article_number, updated_at, published_at, created_at')
    .eq('published', true)
    .order('published_at', { ascending: false });

  const today = new Date().toISOString().split('T')[0];

  const staticPages = [
    { url: '/',          priority: '1.0', changefreq: 'daily',   lastmod: today },
    { url: '/news',      priority: '0.9', changefreq: 'daily',   lastmod: today },
    { url: '/rules',     priority: '0.7', changefreq: 'weekly',  lastmod: today },
    { url: '/calendar',  priority: '0.8', changefreq: 'daily',   lastmod: today },
    { url: '/partners',  priority: '0.4', changefreq: 'monthly', lastmod: today },
    { url: '/contact',   priority: '0.3', changefreq: 'monthly', lastmod: today },
  ];

  const staticEntries = staticPages.map(p => `  <url>
    <loc>${siteUrl}${p.url}</loc>
    <lastmod>${p.lastmod}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`);

  const articleEntries = (articles || []).map(article => {
    const lastmod = new Date(
      article.updated_at || article.published_at || article.created_at
    ).toISOString().split('T')[0];

    return `  <url>
    <loc>${siteUrl}${articleUrl(article)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticEntries, ...articleEntries].join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
};
