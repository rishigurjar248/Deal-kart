import { useEffect } from "react";

export const SITE_URL =
  (import.meta.env.VITE_SITE_URL || "https://dealkart-flax.vercel.app").replace(/\/+$/, "");

export function slugify(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

export function productPath(product) {
  return `/product/${slugify(product?.name || "deal")}-${Number(product?.id || product?.page || 0)}`;
}

function upsertMeta(attribute, key, content) {
  if (!content) return;
  let node = document.head.querySelector(`meta[${attribute}="${CSS.escape(key)}"]`);
  if (!node) {
    node = document.createElement("meta");
    node.setAttribute(attribute, key);
    document.head.appendChild(node);
  }
  node.setAttribute("content", content);
}

function setJsonLd(id, data) {
  let node = document.head.querySelector(`script[data-seo-schema="${id}"]`);
  if (!node) {
    node = document.createElement("script");
    node.type = "application/ld+json";
    node.dataset.seoSchema = id;
    document.head.appendChild(node);
  }
  node.textContent = JSON.stringify(data);
}

export default function SEO({
  title,
  description,
  path = "/",
  image = "/og-image.jpg",
  type = "website",
  noindex = false,
  schema = null,
}) {
  useEffect(() => {
    const canonicalUrl = `${SITE_URL}${path === "/" ? "/" : path}`;
    document.title = title;
    upsertMeta("name", "description", description);
    upsertMeta("name", "robots", noindex ? "noindex,nofollow" : "index,follow,max-image-preview:large");
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:url", canonicalUrl);
    upsertMeta("property", "og:image", image.startsWith("http") ? image : `${SITE_URL}${image}`);
    upsertMeta("property", "og:image:alt", `${title} — DealKart`);
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", image.startsWith("http") ? image : `${SITE_URL}${image}`);

    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = canonicalUrl;

    if (schema) setJsonLd("page", schema);
    else {
      const existing = document.head.querySelector('script[data-seo-schema="page"]');
      existing?.remove();
    }

    return () => {};
  }, [title, description, path, image, type, noindex, schema]);

  return null;
}

export function homeSchema(products = []) {
  const itemList = products.slice(0, 20).map((p, index) => ({
    "@type": "ListItem",
    position: index + 1,
    url: `${SITE_URL}${productPath(p)}`,
    name: p.name,
    image: p.image || undefined,
  }));
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "DealKart",
      url: SITE_URL,
      logo: `${SITE_URL}/favicon.png`,
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+91-9244335428",
        contactType: "customer service",
        areaServed: "IN",
        availableLanguage: ["English", "Hindi"],
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "DealKart",
      url: SITE_URL,
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "DealKart featured deals",
      itemListElement: itemList,
    },
  ];
}

export function productSchema(product) {
  const images = [product?.image, ...(product?.galleryImages || [])].filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product?.name,
    image: images,
    description: product?.description,
    brand: product?.brand ? { "@type": "Brand", name: product.brand } : undefined,
    sku: String(product?.id || product?.page || ""),
    aggregateRating:
      Number(product?.reviewCount || product?.reviews) > 0 && Number(product?.rating) > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: Number(product.rating),
            reviewCount: Number(product.reviewCount || product.reviews),
          }
        : undefined,
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}${productPath(product)}`,
      priceCurrency: "INR",
      price: Number(product?.price || 0),
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };
}
