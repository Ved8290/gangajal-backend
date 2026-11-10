const fs = require('fs');
const path = require('path');
const env = require('../config/env');
const Product = require('../models/Product');
const Settings = require('../models/BusinessSettings');
const asyncHandler = require('../utils/asyncHandler');

const PAGES = ['/', '/products', '/about', '/contact', '/faq', '/shipping-policy', '/privacy-policy', '/terms', '/refund-policy', '/track-order'];
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const ld = (o) => `<script type="application/ld+json" data-server-seo>${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`;

exports.robots = (req, res) => res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nDisallow: /checkout\nDisallow: /cart\n\nSitemap: ${env.siteUrl}/sitemap.xml\n`);

exports.sitemap = asyncHandler(async (req, res) => {
  const products = await Product.find({ active: true }).select('slug updatedAt').lean();
  const urls = [...PAGES.map((p) => `<url><loc>${env.siteUrl}${p}</loc><changefreq>weekly</changefreq><priority>${p === '/' ? '1.0' : '0.7'}</priority></url>`), ...products.map((p) => `<url><loc>${env.siteUrl}/product/${p.slug}</loc><lastmod>${new Date(p.updatedAt).toISOString()}</lastmod><priority>0.9</priority></url>`)];
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`);
});

const DEFAULT = {
  title: 'Buy Gangajal Online | Trambakeshwar Jal from Nashik | गंगाजल ऑनलाइन',
  description: 'Order authentic Gangajal and Trambakeshwar Jal from Nashik online. Nashik Kumbh Mela special holy water, delivered to your home. गंगाजल घरपोच – WhatsApp वर ऑर्डर करा.',
};

// Injects per-URL title/description/Open Graph/JSON-LD into index.html so crawlers see them without running JavaScript
exports.renderPage = (dist) => {
  let html;
  return asyncHandler(async (req, res) => {
    html = html || fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
    const settings = await Settings.get();
    const url = env.siteUrl + (req.path === '/' ? '/' : req.path.replace(/\/$/, ''));
    let meta = { ...DEFAULT, image: `${env.siteUrl}/og-image.png`, type: 'website', extra: [] };
    let status = 200;
    const m = req.path.match(/^\/product\/([^/]+)\/?$/);
    if (m) {
      const p = await Product.findOne({ slug: m[1], active: true }).lean();
      if (!p) status = 404;
      else {
        meta = {
          title: `${p.name.en} – ${p.name.mr} | ${settings.businessName}`,
          description: (p.description.en || `${p.name.en} – authentic holy water from Nashik.`).slice(0, 160),
          image: p.images?.[0] ? env.siteUrl + p.images[0].url : meta.image,
          type: 'product',
          extra: [ld({ '@context': 'https://schema.org', '@type': 'Product', name: p.name.en, description: p.description.en, sku: p.sku, image: p.images?.map((i) => env.siteUrl + i.url), brand: { '@type': 'Brand', name: settings.businessName }, offers: { '@type': 'Offer', priceCurrency: 'INR', price: p.effectivePrice, availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', url } })],
        };
      }
    }
    meta.extra.push(ld({ '@context': 'https://schema.org', '@type': 'Organization', name: settings.businessName, url: env.siteUrl, logo: settings.logo ? env.siteUrl + settings.logo : undefined, email: settings.email || undefined, telephone: settings.contactNumber || undefined, address: settings.address }));
    const robots = req.path.startsWith('/admin') ? '<meta name="robots" content="noindex,nofollow" data-server-seo>' : '';
    const head = `<title data-server-seo>${esc(meta.title)}</title><meta name="description" content="${esc(meta.description)}" data-server-seo><link rel="canonical" href="${esc(url)}" data-server-seo><meta property="og:type" content="${meta.type}" data-server-seo><meta property="og:title" content="${esc(meta.title)}" data-server-seo><meta property="og:description" content="${esc(meta.description)}" data-server-seo><meta property="og:image" content="${esc(meta.image)}" data-server-seo><meta property="og:url" content="${esc(url)}" data-server-seo><meta name="twitter:card" content="summary_large_image" data-server-seo>${robots}${meta.extra.join('')}`;
    res.status(status).type('html').send(html.replace('<!--SEO_HEAD-->', head));
  });
};
