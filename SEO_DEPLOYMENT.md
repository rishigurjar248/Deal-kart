# DealKart SEO implementation

Implemented:
- `public/robots.txt` with crawl rules and sitemap reference.
- Dynamic `/sitemap.xml` via `api/sitemap.js`, including active Supabase products.
- `/product/<slug>-<id>` crawlable product URLs.
- Canonical, robots, Open Graph, Twitter metadata.
- Product, Organization, WebSite, ItemList and Breadcrumb-compatible product page structure.
- One visible H1 per public page; improved heading hierarchy.
- Descriptive image alt text plus width/height, lazy loading and decoding.
- WebP conversion of large hero assets; optimized favicon and OG image.
- Cache headers for immutable assets.
- Mobile product page and responsive SEO layout.
- Internal product-to-product links and crawlable product anchors.
- Vercel rewrites for product pages, today's special, admin and sitemap.
- Admin route marked `noindex,nofollow`.

## Before deployment
Set `VITE_SITE_URL` in Vercel to the final public HTTPS domain. The current fallback is:
`https://dealkart-flax.vercel.app`

If you later move to a custom domain, update the environment variable and redeploy. Do not manually edit individual canonical URLs.

## Google Search Console
This cannot be completed inside the source ZIP because it requires access to your Google account/property. After deployment:
1. Add/verify the HTTPS property.
2. Submit `/sitemap.xml`.
3. Use URL Inspection on `/` and a few `/product/...` URLs.
4. Request indexing after the new deployment is live.

## Backlinks
No code change can legitimately create authoritative backlinks. Build them through real business profiles, relevant product/category mentions, partnerships, creator reviews, and useful original content. Avoid paid/spam link networks.
