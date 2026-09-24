import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const siteRoot = process.cwd();
const baseUrl = 'https://www.cwpackingbox.com';
const gaMeasurementId = 'G-78RG0ZFK7E';
const gaScript = `
<script async src="https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${gaMeasurementId}');
</script>`;

function pageUrl(fileName) {
  return fileName === 'index.html' ? `${baseUrl}/` : `${baseUrl}/${fileName}`;
}

function addOrReplaceTag(html, pattern, tag, anchorPattern) {
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace(anchorPattern, (match) => `${match}${tag}`);
}

let changed = 0;

for (const entry of readdirSync(siteRoot, { withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith('.html')) continue;

  const filePath = join(siteRoot, entry.name);
  const original = readFileSync(filePath, 'utf8');
  let html = original;

  if (!new RegExp(`googletagmanager\\.com/gtag/js\\?id=${gaMeasurementId}`).test(html)) {
    html = html.replace(/<head[^>]*>/i, (match) => `${match}${gaScript}`);
  }

  if (entry.name === '404.html') {
    if (!/<meta\s+[^>]*name=["']robots["'][^>]*>/i.test(html)) {
      html = html.replace(/<head[^>]*>/i, (match) => `${match}<meta name="robots" content="noindex,follow"/>`);
    } else {
      html = html.replace(/<meta\s+[^>]*name=["']robots["'][^>]*>/i, '<meta name="robots" content="noindex,follow"/>');
    }
  } else {
    const url = pageUrl(entry.name);
    const canonical = `<link rel="canonical" href="${url}"/>`;
    const ogUrl = `<meta property="og:url" content="${url}"/>`;

    html = addOrReplaceTag(
      html,
      /<link\s+[^>]*rel=["']canonical["'][^>]*>/i,
      canonical,
      /<meta\s+[^>]*name=["']robots["'][^>]*>/i,
    );
    html = addOrReplaceTag(
      html,
      /<meta\s+[^>]*property=["']og:url["'][^>]*>/i,
      ogUrl,
      /<meta\s+[^>]*property=["']og:type["'][^>]*>/i,
    );
  }

  if (html !== original) {
    writeFileSync(filePath, html, 'utf8');
    changed += 1;
  }
}

console.log(`Updated SEO head tags in ${changed} HTML files.`);
