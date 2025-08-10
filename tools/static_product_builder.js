const fs = require('fs');
const path = require('path');

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'product';
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildImageUrl(url, w, h) {
  if (!url || /^data:/.test(url)) return url || '';
  try {
    const parts = url.split('/upload/');
    if (parts.length === 2) {
      const t = `upload/c_fill,g_auto,q_auto,f_auto,w_${w},h_${h}/`;
      return parts[0] + '/' + t + parts[1];
    }
    return url;
  } catch (_) {
    return url;
  }
}

function renderHtml(p) {
  const id = p.id;
  const name = escapeHtml(p.name);
  const description = escapeHtml(p.description || '');
  const price = Number(p.price || 0).toFixed(2);
  const main = buildImageUrl(p.image_url, 800, 800);
  const subs = Array.isArray(p.sub_images) ? p.sub_images.map(u => buildImageUrl(u, 300, 120)) : [];
  const canonical = `/pages/product.html?id=${id}`;

  const jsonLd = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: p.name,
    image: [p.image_url, ...subs].filter(Boolean),
    description: p.description || '',
    offers: { '@type': 'Offer', priceCurrency: 'USD', price: String(p.price || ''), availability: 'https://schema.org/InStock' }
  };

  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<link rel="canonical" href="${canonical}"/>
<title>${name} | PlwgsCreativeApparel</title>
<meta name="description" content="${description.slice(0, 150)}"/>
<link rel="preconnect" href="https://res.cloudinary.com" crossorigin>
<link rel="preload" as="image" href="${main}">
<style>
  :root{color-scheme:dark light}
  body{margin:0;background:#0b0f14;color:#eaf6f6;font-family:Inter,system-ui,Segoe UI,Roboto,Arial,sans-serif}
  header{position:sticky;top:0;z-index:10;background:#0b0f14;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.08)}
  .wrap{max-width:1024px;margin:0 auto;padding:12px}
  .title{font-weight:800;font-size:20px;letter-spacing:.5px}
  .hero{display:grid;gap:12px}
  .hero img{max-width:100%;height:auto;border-radius:10px;background:#0e141a}
  .price{font-size:20px;font-weight:700;color:#00bcd4}
  .btn{display:inline-block;padding:12px 16px;border-radius:10px;background:#00bcd4;color:#00131a;font-weight:700;text-decoration:none}
  @media(min-width:768px){.hero{grid-template-columns:1fr 1fr}}
  footer{padding:24px;color:#9fb5c0}
  a{color:#00bcd4}
  h1{margin:8px 0 12px}
  p{margin:8px 0}
</style>
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>
<header class="wrap"><div class="title">PLWGS</div></header>
<main class="wrap">
  <section class="hero">
    <div>
      <img src="${main}" width="800" height="800" alt="${name}" fetchpriority="high"/>
      ${subs.map(u=>`<img src="${u}" width="300" height="120" alt="${name} - gallery" loading="lazy"/>`).join('')}
    </div>
    <div>
      <h1>${name}</h1>
      <p class="price">$${price}</p>
      <p>${description}</p>
      <a class="btn" href="/pages/product.html?id=${id}">Buy on dynamic page</a>
    </div>
  </section>
</main>
<footer class="wrap">© ${new Date().getFullYear()} PlwgsCreativeApparel</footer>
</body></html>`;
}

async function buildStaticProductPage(productRow) {
  if (!productRow || !productRow.id || !productRow.name) throw new Error('Invalid product for static build');

  const safe = {
    ...productRow,
    tags: productRow.tags || [],
    sub_images: productRow.sub_images || []
  };

  const html = renderHtml(safe);
  const outDir = path.join(__dirname, '..', 'pages', 'products');
  const file = `${safe.id}-${slugify(safe.name)}.html`;
  const outPath = path.join(outDir, file);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, html, 'utf8');
  return outPath;
}

module.exports = { buildStaticProductPage };


