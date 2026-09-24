import { readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const siteRoot = process.cwd();
const baseUrl = 'https://www.cwpackingbox.com';
const excludedPages = new Set(['404.html', 'index.html']);

const pages = readdirSync(siteRoot, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.html'))
  .map((entry) => entry.name)
  .filter((name) => !excludedPages.has(name))
  .sort((a, b) => a.localeCompare(b));

const urls = [
  `${baseUrl}/`,
  ...pages.map((page) => `${baseUrl}/${page}`),
];

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls.map((url) => `  <url><loc>${url}</loc></url>`),
  '</urlset>',
  '',
].join('\n');

writeFileSync(join(siteRoot, 'sitemap.xml'), sitemap, 'utf8');
console.log(`Generated sitemap.xml with ${urls.length} URLs.`);
