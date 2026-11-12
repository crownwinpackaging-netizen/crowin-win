import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const categoryPages = [
  'magnetic-gift-boxes.html', 'foldable.html', 'rigid-gift-boxes.html',
  'drawer-boxes.html', 'double-door-boxes.html', 'paper-tube-boxes.html',
  'advent-calendar-boxes.html', 'folding-cartons.html', 'paper-bags.html',
  'beauty.html', 'fragrance.html', 'candles.html',
];

const minimumOrder = '500 pcs';
const sampleLeadTime = '15 days';
const cardLeadTime = '15 days';
const cardPattern = /<article\b[^>]*\bclass="product-card"[^>]*>[\s\S]*?<\/article>/g;
const metaPattern = /(<div class="product-meta">)([\s\S]*?)(<\/div>\s*(?=<a\b[^>]*class="product-quote-btn"))/;
const productHref = card => card.match(/<a\b[^>]*\bclass="product-img"[^>]*\bhref="(product-[a-z0-9-]+\.html)"/)?.[1];

function fillCardDetails(card) {
  if (!productHref(card)) return card;
  const feature = card.match(/<span class="product-tag">([^<]+)<\/span>/)?.[1]?.trim() || 'Custom packaging';
  const values = { MOQ: minimumOrder, 'Lead time': cardLeadTime, Feature: feature };
  const meta = card.match(metaPattern);
  const missing = Object.entries(values)
    .filter(([label]) => !meta?.[2].includes(`class="meta-key">${label}</span>`))
    .map(([label, value]) => `<div class="meta-item"><span class="meta-key">${label}</span><span class="meta-val">${value}</span></div>`)
    .join('');
  if (!missing) return card;
  if (meta) return card.replace(metaPattern, (_, open, fields, close) => open + fields + missing + close);
  const quoteButton = /<a\b[^>]*\bclass="product-quote-btn"/;
  if (!quoteButton.test(card) || card.includes('class="product-meta"')) {
    throw new Error(`Cannot complete product card for ${productHref(card)}.`);
  }
  return card.replace(quoteButton, match => `<div class="product-meta">${missing}</div>${match}`);
}

const detailFields = [
  ['MOQ', minimumOrder],
  ['Customization', 'Size, artwork and finish'],
  ['Sampling', 'Available on request'],
  ['Sample lead time', sampleLeadTime],
];
const detailBlock = '<dl class="pdp-order-details">' + detailFields
  .map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`)
  .join('') + '</dl>';

export function syncCollections(siteRoot) {
  const path = join(siteRoot, 'collections.html');
  const html = readFileSync(path, 'utf8');
  const existing = html.match(cardPattern) ?? [];
  const seen = new Set(existing.map(productHref));
  const filters = new Set([...html.matchAll(/\bdata-filter="([^"]+)"/g)].map(match => match[1]));
  const additions = [];
  const updates = new Map();

  for (const page of categoryPages) {
    const categoryPath = join(siteRoot, page);
    const category = readFileSync(categoryPath, 'utf8');
    const updated = category.replace(cardPattern, card => {
      const href = productHref(card);
      const completed = fillCardDetails(card);
      if (!href || seen.has(href)) return completed;
      const filter = card.match(/\bdata-category="([^"]+)"/)?.[1];
      if (!filters.has(filter) || !existsSync(join(siteRoot, href))) {
        throw new Error(`Cannot add ${href} from ${page}: missing product page or unknown collection filter.`);
      }
      additions.push(completed);
      seen.add(href);
      return completed;
    });
    if (updated !== category) updates.set(categoryPath, updated);
  }

  const grid = '<div class="products-grid">';
  const count = /(<p\b[^>]*\bid="filter-count"[^>]*>)[^<]*(<\/p>)/;
  if (!html.includes(grid) || !count.test(html)) {
    throw new Error('Collection grid or product count is missing.');
  }

  const next = html
    .replace(cardPattern, fillCardDetails)
    .replace(grid, () => grid + additions.join(''))
    .replace(count, (_, open, close) => `${open}${existing.length + additions.length} packaging examples${close}`);
  if (next !== html) updates.set(path, next);

  for (const page of readdirSync(siteRoot).filter(name => /^product-[a-z0-9-]+\.html$/.test(name))) {
    const productPath = join(siteRoot, page);
    const product = readFileSync(productPath, 'utf8');
    if (product.includes('class="pdp-order-details"')) {
      const updated = product.replace(/(<dt>Sample lead time<\/dt>\s*<dd>)[^<]*(<\/dd>)/g,
        (_, open, close) => open + sampleLeadTime + close);
      if (updated !== product) updates.set(productPath, updated);
      continue;
    }
    const cta = '<div class="pdp-hero-cta">';
    if (!product.includes(cta)) throw new Error(`Product inquiry section is missing in ${page}.`);
    updates.set(productPath, product.replace(cta, detailBlock + cta));
  }

  for (const page of readdirSync(siteRoot).filter(name => name.endsWith('.html'))) {
    const file = join(siteRoot, page);
    const html = updates.get(file) ?? readFileSync(file, 'utf8');
    const normalized = html
      .replace(/(<span class="meta-key">MOQ<\/span>\s*<span class="meta-val">)[^<]*(<\/span>)/g,
        (_, open, close) => open + minimumOrder + close)
      .replace(/(<span class="meta-key">Lead time<\/span>\s*<span class="meta-val">)[^<]*(<\/span>)/g,
        (_, open, close) => open + cardLeadTime + close)
      .replace(/(<dt>MOQ<\/dt>\s*<dd>)[^<]*(<\/dd>)/g,
        (_, open, close) => open + minimumOrder + close);
    if (normalized !== html) updates.set(file, normalized);
  }

  for (const [file, content] of updates) writeFileSync(file, content, 'utf8');
  console.log(`Collections: added ${additions.length} product cards; updated ${updates.size} pages.`);
}
