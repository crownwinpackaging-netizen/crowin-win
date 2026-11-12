import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const categoryPages = [
  'magnetic-gift-boxes.html', 'foldable.html', 'rigid-gift-boxes.html',
  'drawer-boxes.html', 'double-door-boxes.html', 'paper-tube-boxes.html',
  'advent-calendar-boxes.html', 'folding-cartons.html', 'paper-bags.html',
  'beauty.html', 'fragrance.html', 'candles.html',
];

function productCards(html) {
  return [...html.matchAll(/<article\b[^>]*\bclass="product-card"[^>]*>[\s\S]*?<\/article>/g)]
    .map(([card]) => ({
      card,
      href: card.match(/<a\b[^>]*\bclass="product-img"[^>]*\bhref="(product-[a-z0-9-]+\.html)"/)?.[1],
      category: card.match(/\bdata-category="([^"]+)"/)?.[1],
    }));
}

export function syncCollections(siteRoot) {
  const path = join(siteRoot, 'collections.html');
  const html = readFileSync(path, 'utf8');
  const existing = productCards(html);
  const seen = new Set(existing.map(({ href }) => href));
  const filters = new Set([...html.matchAll(/\bdata-filter="([^"]+)"/g)].map(match => match[1]));
  const additions = [];

  for (const page of categoryPages) {
    const category = readFileSync(join(siteRoot, page), 'utf8');
    for (const { card, href, category: filter } of productCards(category)) {
      if (!href || seen.has(href)) continue;
      if (!filters.has(filter) || !existsSync(join(siteRoot, href))) {
        throw new Error(`Cannot add ${href} from ${page}: missing product page or unknown collection filter.`);
      }
      additions.push(card);
      seen.add(href);
    }
  }

  const grid = '<div class="products-grid">';
  const count = /(<p\b[^>]*\bid="filter-count"[^>]*>)[^<]*(<\/p>)/;
  if (!html.includes(grid) || !count.test(html)) {
    throw new Error('Collection grid or product count is missing.');
  }

  const next = html
    .replace(grid, () => grid + additions.join(''))
    .replace(count, (_, open, close) => `${open}${existing.length + additions.length} packaging examples${close}`);
  if (next !== html) writeFileSync(path, next, 'utf8');
  console.log(`Collections: added ${additions.length} product cards.`);
}
