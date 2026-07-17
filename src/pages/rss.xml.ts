import type { APIRoute } from 'astro';
import { supabase } from '../lib/supabase';
import { articleUrl } from '../lib/articleUrl';

export const prerender = false;

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toRFC822(date: string | Date): string {
  const d = new Date(date);
  return d.toUTCString();
}

export const GET: APIRoute = async ({ site }) => {
  const siteUrl = site?.href?.replace(/\/$/, '') || 'https://www.riftbound-media.fr';

  const { data: articles, error } = await supabase
    .from('articles')
    .select('title, slug, article_number, summary, image_url, tags, published_at, created_at, updated_at')
    .eq('published', true)
    .order('published_at', { ascending: false })
    .limit(50);

  if (error || !articles) {
    return new Response('Erreur lors de la génération du flux RSS', { status: 500 });
  }

  const lastBuildDate = articles.length > 0
    ? toRFC822(articles[0].published_at || articles[0].created_at)
    : toRFC822(new Date());

  const items = articles.map((article) => {
    const pubDate = toRFC822(article.published_at || article.created_at);
    const link = `${siteUrl}${articleUrl(article)}`;
    const description = article.summary || '';
    const categories = (article.tags || [])
      .map((tag: string) => `      <category>${escapeXml(tag)}</category>`)
      .join('\n');

    // Image enclosure if available
    const enclosure = article.image_url
      ? `      <enclosure url="${escapeXml(article.image_url)}" type="image/jpeg" />`
      : '';

    return `    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${escapeXml(description)}</description>
      <pubDate>${pubDate}</pubDate>
${categories}
${enclosure}
    </item>`;
  }).join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Riftbound Media — Actualités</title>
    <description>Les dernières actualités de l'univers Riftbound, traduites en français</description>
    <link>${siteUrl}/news</link>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
    <language>fr</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <image>
      <url>${siteUrl}/riftbound-logo.png</url>
      <title>Riftbound Media</title>
      <link>${siteUrl}</link>
    </image>
${items}
  </channel>
</rss>`;

  return new Response(rss, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
};
