import { createClient } from "@supabase/supabase-js";

const SITE_URL = (process.env.VITE_SITE_URL || "https://dealkart-flax.vercel.app").replace(/\/+$/, "");

const slugify = (value = "") =>
  String(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);

const productUrl = (p) =>
  `${SITE_URL}/product/${slugify(p.name || "deal")}-${Number(p.id)}`;

export default async function handler(req, res) {
  const urls = [
    { loc: `${SITE_URL}/`, priority: "1.0", changefreq: "daily" },
    { loc: `${SITE_URL}/todays-special`, priority: "0.9", changefreq: "daily" },
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
        .select("id,name,updated_at,is_active")
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(5000);

      for (const p of data || []) {
        urls.push({
          loc: productUrl(p),
          lastmod: p.updated_at ? new Date(p.updated_at).toISOString() : undefined,
          priority: "0.8",
          changefreq: "weekly",
        });
      }
    } catch {
      // Keep the core sitemap valid even if the catalog database is temporarily unavailable.
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    ${u.lastmod ? `<lastmod>${escapeXml(u.lastmod)}</lastmod>` : ""}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join("\n")}
</urlset>`;

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=1800");
  return res.status(200).send(xml);
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
