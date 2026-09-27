import { createClient } from "@supabase/supabase-js";

const SITE_URL = "https://dealkart-flax.vercel.app";

const escapeXml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const urls = [
    { loc: `${SITE_URL}/`, changefreq: "daily", priority: "1.0" },
    { loc: `${SITE_URL}/deals`, changefreq: "daily", priority: "0.9" },
  ];

  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const db = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { persistSession: false, autoRefreshToken: false } },
      );
      const { data } = await db
        .from("products")
        .select("id,updated_at")
        .eq("is_active", true)
        .order("id", { ascending: true });

      for (const product of data || []) {
        if (!Number.isFinite(Number(product.id))) continue;
        urls.push({
          loc: `${SITE_URL}/product/${Number(product.id)}`,
          lastmod: product.updated_at || undefined,
          changefreq: "weekly",
          priority: "0.7",
        });
      }
    } catch (error) {
      console.error("DealKart sitemap catalog query failed:", error);
    }
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map(
      (url) =>
        `  <url>\n    <loc>${escapeXml(url.loc)}</loc>${
          url.lastmod ? `\n    <lastmod>${escapeXml(new Date(url.lastmod).toISOString())}</lastmod>` : ""
        }\n    <changefreq>${url.changefreq}</changefreq>\n    <priority>${url.priority}</priority>\n  </url>`,
    )
    .join("\n")}\n</urlset>`;

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
  return res.status(200).send(body);
}
