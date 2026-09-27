# DealKart SEO setup

This project is configured for the current temporary production URL:

`https://dealkart-flax.vercel.app/`

## Included

- Homepage SEO title, description, canonical URL and robots directives.
- Open Graph and Twitter metadata.
- DealKart `Organization` and `WebSite` structured data.
- A real homepage `<h1>` focused on the DealKart brand.
- `/deals` as a crawlable daily-deals URL.
- `/product/:id` URLs with dynamic Product structured data and product-specific metadata.
- Dynamic `/sitemap.xml` backed by the active Supabase catalog.
- `robots.txt` referencing the sitemap.
- Favicon and social preview assets.
- Vercel rewrites for the SEO-friendly routes.

## After deploying to Vercel

1. Open Google Search Console for the existing `dealkart-flax.vercel.app` property.
2. Go to **Indexing → Sitemaps**.
3. Submit:

   `https://dealkart-flax.vercel.app/sitemap.xml`

4. Use **URL Inspection** for:
   - `https://dealkart-flax.vercel.app/`
   - `https://dealkart-flax.vercel.app/deals`
5. Request indexing after the new deployment.

Do not change the canonical URL to a future custom domain until that domain is actually live. When the custom domain is purchased later, update the single `SITE_URL`/canonical configuration and Search Console property together.

## Important

SEO changes improve Google's understanding and crawlability, but no code can guarantee a permanent Top-3 ranking. For a new brand, continue building genuine brand mentions, useful product/category content and real customer traffic over time.
