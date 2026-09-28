# DealKart Professionalization Update

The existing frontend, visual identity, product content, Supabase catalog flow, and admin structure were preserved.

## SEO
- Added canonical URL for the current Vercel deployment.
- Added robots meta directives.
- Added Open Graph and Twitter metadata.
- Added Organization and WebSite JSON-LD.
- Added dynamic page/product metadata updates.
- Added dynamic ItemList JSON-LD after the live catalog loads.
- Added `public/robots.txt` and `public/sitemap.xml`.
- Added a no-JavaScript fallback message.

## Accessibility
- Added semantic primary navigation labeling.
- Improved accessible labels for wishlist/cart/theme controls.
- Added keyboard activation for product cards.
- Added dialog semantics and accessible titles to product, wishlist, cart, information, and checkout overlays.
- Added Escape-key closing and background scroll locking for dialogs.
- Added visible keyboard focus states.
- Added carousel tab semantics.
- Added checkout autocomplete, required fields, and validation state hints.
- Added accessible toast announcements.
- Added reduced-motion support.
- Added meaningful lazy-loaded image alt text where appropriate.

## Code quality / performance
- Centralized safe localStorage access so restricted storage does not break the storefront.
- Replaced the scroll-based reveal scanner with IntersectionObserver to reduce continuous scroll work.
- Added lazy image loading and async decoding for non-hero product imagery.
- Added high-priority loading for the first hero image.
- Added `noopener noreferrer` to external links opened in new tabs.
- Added dialog lifecycle cleanup for keyboard listeners and body state.

## Validation note
The included `node_modules` in the uploaded ZIP is missing the platform-specific Rolldown native binding required by the installed Vite version. `npm run build` therefore could not be completed in this environment. The source changes were applied directly and the existing application dependency versions were not intentionally changed.

If the project is installed fresh with a normal `npm install`/`npm ci` on the deployment environment, Vercel should install the required optional native dependency during the build.
