import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const siteUrl = (process.env.SITE_URL || process.env.VITE_SITE_URL || 'https://syrox.bolt.host').replace(/\/$/, '');

// Keep this list in sync with the public ViewId routes in src/components/Navigation.tsx.
// The sitemap is regenerated on every production build, so newly listed views are never
// forgotten in a committed/stale sitemap file.
const routes = [
  { view: null, changefreq: 'daily', priority: '1.0' },
  { view: 'dashboard', changefreq: 'daily', priority: '0.9' },
  { view: 'tasks', changefreq: 'daily', priority: '0.8' },
  { view: 'story', changefreq: 'weekly', priority: '0.7' },
  { view: 'workout', changefreq: 'weekly', priority: '0.7' },
  { view: 'dungeons', changefreq: 'weekly', priority: '0.7' },
  { view: 'profile', changefreq: 'weekly', priority: '0.7' },
  { view: 'marketplace', changefreq: 'weekly', priority: '0.6' },
  { view: 'inventory', changefreq: 'weekly', priority: '0.5' },
  { view: 'achievements', changefreq: 'weekly', priority: '0.6' },
  { view: 'leaderboard', changefreq: 'daily', priority: '0.7' },
  { view: 'shadow', changefreq: 'weekly', priority: '0.6' },
  { view: 'settings', changefreq: 'monthly', priority: '0.4' },
];

const urls = routes.map(({ view, changefreq, priority }) => {
  const loc = view ? `${siteUrl}/?view=${encodeURIComponent(view)}` : `${siteUrl}/`;
  return `  <url>\n    <loc>${loc}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}).join('\n');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

const output = resolve(process.cwd(), 'public', 'sitemap.xml');
await mkdir(resolve(process.cwd(), 'public'), { recursive: true });
await writeFile(output, sitemap, 'utf8');
console.log(`Generated ${output} for ${siteUrl}`);
