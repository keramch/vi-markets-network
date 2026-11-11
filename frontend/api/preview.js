// Link preview pages for social apps (T097).
//
// Facebook, iMessage, WhatsApp, Slack and similar read a shared link without
// running the site's JavaScript, so they only ever saw the homepage's preview
// tags. vercel.json sends those apps (recognised by their user agent) here for
// market, vendor and event links. People clicking a link never come here.
// This asks the backend's /share-preview for the page's title, description and
// image, and answers with a tiny page holding just those preview tags. If
// anything fails, it answers with the site-wide card instead.

const SITE_CARD = {
  title: 'VI Markets Network — Find Local Markets & Vendors on Vancouver Island',
  description: 'Discover farmers markets, artisan fairs, and local vendors across Vancouver Island and the Gulf Islands.',
  image: 'https://vimarkets.ca/og-image.png',
};

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function fetchPreview(path) {
  const api = process.env.VITE_API_URL;
  if (!api || !/^\/(markets|vendors)\/[^?#]+$/.test(path)) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000); // a slow card beats no card
  try {
    const res = await fetch(`${api}/share-preview?path=${encodeURIComponent(path)}`, { signal: controller.signal });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data?.title === 'string' ? data : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req, res) {
  const path = typeof req.query.path === 'string' ? req.query.path : '/';
  const found = await fetchPreview(path);

  const title = found ? `${found.title} | VI Markets` : SITE_CARD.title;
  const description = found?.description || SITE_CARD.description;
  const image = found?.image || SITE_CARD.image;
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'vimarkets.ca';
  const url = `https://${host}${found ? path : ''}`;

  const tags = [
    ['property', 'og:site_name', 'VI Markets Network'],
    ['property', 'og:type', 'website'],
    ['property', 'og:title', title],
    ['property', 'og:description', description],
    ['property', 'og:image', image],
    ['property', 'og:url', url],
    ['name', 'twitter:card', 'summary_large_image'],
    ['name', 'twitter:title', title],
    ['name', 'twitter:description', description],
    ['name', 'twitter:image', image],
    ['name', 'description', description],
  ]
    .map(([attr, key, value]) => `<meta ${attr}="${key}" content="${escapeHtml(value)}" />`)
    .join('\n    ');

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300');
  res.status(200).send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    ${tags}
    <link rel="canonical" href="${escapeHtml(url)}" />
  </head>
  <body>
    <p><a href="${escapeHtml(url)}">${escapeHtml(title)}</a></p>
  </body>
</html>`);
}
