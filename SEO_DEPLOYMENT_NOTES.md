# DealKart SEO deployment notes

This project preserves the storefront UI and application code from `try(1).zip` and adds baseline technical SEO files.

## Added
- Search-friendly HTML title and description
- Canonical URL for `https://dealkart-flax.vercel.app/`
- Open Graph and Twitter share metadata
- Organization and WebSite JSON-LD
- `public/robots.txt`
- `public/sitemap.xml`
- `public/site.webmanifest`
- Public copies of the existing DealKart logo and symbol for metadata/favicon use

## Before/after deployment
1. Confirm `https://dealkart-flax.vercel.app/` is the preferred canonical domain and redirects consistently from any alternate domain/host.
2. Deploy this Vite project. The `public` files should be served at `/robots.txt`, `/sitemap.xml`, `/site.webmanifest`, `/dealkart-symbol.png`, and `/dealkart-logo.png`.
3. In Google Search Console, open URL Inspection for `https://dealkart-flax.vercel.app/`, test the live URL, then request indexing.
4. Submit `https://dealkart-flax.vercel.app/sitemap.xml` under Sitemaps.
5. If Search Console requires a `google-site-verification` HTML tag or HTML file, copy the exact value/file provided by Search Console into this project. Neither uploaded ZIP contained a verification token, so one was not fabricated.
6. Verify that the deployed homepage returns HTTP 200, is not blocked by robots rules, and has the canonical URL above.

## Important SEO limitation
This project is a Vite/React single-page application. These changes improve homepage metadata and crawl discovery but cannot guarantee a top Google ranking. Product details rendered only after JavaScript runs may be indexed less consistently than server-rendered pages. Product-specific SEO requires stable, crawlable product URLs and server-side rendering or pre-rendered HTML, plus accurate product structured data. Do not add invented product URLs to the sitemap.
