import { createClient } from "@supabase/supabase-js";
import { getCookie, verifySession, COOKIE_NAME } from "../lib/auth.js";

const getDb = () => createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const arrayValue = (value) => Array.isArray(value) ? value : [];

const mapRow = (r = {}, imageRows = []) => {
  const orderedImages = imageRows
    .filter((x) => x?.image_url)
    .sort((a, b) => Number(a.position) - Number(b.position))
    .map((x) => x.image_url)
    .slice(0, 5);
  const legacyImages = [r.image, ...arrayValue(r.gallery_images), ...arrayValue(r.images)].filter(Boolean);
  const imageUrls = [...new Set([...orderedImages, ...legacyImages])].slice(0, 5);

  return {
    id: Number(r.id),
    page: Number(r.page ?? r.id),
    name: r.name ?? "",
    brand: r.brand ?? "",
    category: r.category ?? "All Deals",
    price: Number(r.price ?? 0),
    mrp: Number(r.mrp ?? r.old_price ?? 0),
    oldPrice: Number(r.old_price ?? r.mrp ?? 0),
    discount: Number(r.discount ?? 0),
    rating: Number(r.rating ?? 4.3),
    reviews: String(r.reviews ?? "0"),
    reviewCount: Number(r.review_count ?? 0),
    image: imageUrls[0] ?? "",
    imageUrls,
    galleryImages: imageUrls.slice(1),
    images: imageUrls,
    keyPoints: arrayValue(r.key_points).slice(0, 4),
    specs: arrayValue(r.key_points).slice(0, 4),
    description: r.description ?? "",
    isTop10: Boolean(r.is_top10),
    top10Rank: r.top10_rank ?? null,
    isActive: r.is_active !== false,
    returnEligible: r.return_eligible !== false,
  };
};

const mapProduct = (p = {}) => {
  const suppliedImages = arrayValue(p.imageUrls ?? p.image_urls);
  const legacyImages = [p.image, ...arrayValue(p.galleryImages ?? p.gallery_images), ...arrayValue(p.images)].filter(Boolean);
  const imageUrls = [...new Set([...suppliedImages, ...legacyImages])].slice(0, 5);
  const keyPoints = arrayValue(p.keyPoints ?? p.key_points ?? p.specs).slice(0, 4);

  return {
    id: Number(p.id),
    page: Number(p.page ?? p.id),
    name: String(p.name ?? ""),
    brand: String(p.brand ?? ""),
    category: String(p.category ?? "All Deals"),
    price: Number(p.price ?? 0),
    mrp: Number(p.mrp ?? p.oldPrice ?? p.old_price ?? 0),
    old_price: Number(p.oldPrice ?? p.old_price ?? p.mrp ?? 0),
    discount: Number(p.discount ?? 0),
    rating: Number(p.rating ?? 4.3),
    reviews: String(p.reviews ?? "0"),
    review_count: Number(p.reviewCount ?? p.review_count ?? 0),
    image: imageUrls[0] || "",
    gallery_images: imageUrls.slice(1),
    images: imageUrls,
    key_points: keyPoints,
    description: String(p.description ?? ""),
    is_top10: Boolean(p.isTop10 ?? p.is_top10),
    top10_rank: p.top10Rank ?? p.top10_rank ?? null,
    is_active: p.isActive !== false && p.is_active !== false,
    return_eligible: p.returnEligible !== false && p.return_eligible !== false,
    updated_at: new Date().toISOString(),
  };
};

export default async function handler(req, res) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: "Supabase environment variables are missing." });
  }

  const db = getDb();

  if (req.method === "GET") {
    const { data, error } = await db
      .from("products")
      .select("id,page,name,brand,category,price,mrp,old_price,discount,rating,reviews,review_count,image,gallery_images,images,key_points,description,is_top10,top10_rank,is_active,return_eligible,created_at")
      .eq("is_active", true)
      .order("top10_rank", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });
    if (error) return res.status(500).json({ error: error.message });

    const ids = (data ?? []).map((p) => p.id);
    let imageRows = [];
    if (ids.length) {
      const { data: images, error: imageError } = await db
        .from("product_images")
        .select("product_id,image_url,position")
        .in("product_id", ids)
        .order("position", { ascending: true });
      if (imageError) return res.status(500).json({ error: imageError.message });
      imageRows = images ?? [];
    }

    const grouped = new Map();
    for (const row of imageRows) {
      if (!grouped.has(row.product_id)) grouped.set(row.product_id, []);
      grouped.get(row.product_id).push(row);
    }

    res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=120");
    res.setHeader("CDN-Cache-Control", "public, s-maxage=30, stale-while-revalidate=120");
    return res.status(200).json({
      products: (data ?? []).map((row) => mapRow(row, grouped.get(row.id) ?? [])),
    });
  }

  if (!verifySession(getCookie(req, COOKIE_NAME))) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (req.method !== "PUT") return res.status(405).json({ error: "Method not allowed" });

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const products = Array.isArray(body?.products) ? body.products : null;
  if (!products) return res.status(400).json({ error: "products must be an array" });
  if (products.length === 0) return res.status(400).json({ error: "Catalog cannot be empty. Keep at least one product." });
  if (products.length > 1000) return res.status(400).json({ error: "Too many products in one save." });

  const rows = products.map(mapProduct).filter((p) => Number.isFinite(p.id) && p.id > 0);
  if (!rows.length) return res.status(400).json({ error: "No valid products were supplied." });

  const duplicateIds = rows.map((p) => p.id).filter((id, i, arr) => arr.indexOf(id) !== i);
  if (duplicateIds.length) return res.status(400).json({ error: "Duplicate product IDs were supplied." });

  const { error: upsertError } = await db.from("products").upsert(rows, { onConflict: "id" });
  if (upsertError) return res.status(500).json({ error: upsertError.message });

  const ids = rows.map((p) => p.id);
  const { error: deactivateError } = await db
    .from("products")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("is_active", true)
    .not("id", "in", `(${ids.join(",")})`);
  if (deactivateError) return res.status(500).json({ error: deactivateError.message });

  // Keep the normalized image table as the source of truth for the 1–5 image gallery.
  const { error: deleteImagesError } = await db.from("product_images").delete().in("product_id", ids);
  if (deleteImagesError) return res.status(500).json({ error: deleteImagesError.message });

  const imageRows = rows.flatMap((p) => {
    const source = [p.image, ...arrayValue(p.gallery_images)].filter(Boolean).slice(0, 5);
    return source.map((url, index) => ({
      product_id: p.id,
      image_url: url,
      position: index + 1,
    }));
  });

  if (imageRows.length) {
    const { error: imageInsertError } = await db.from("product_images").insert(imageRows);
    if (imageInsertError) return res.status(500).json({ error: imageInsertError.message });
  }

  return res.status(200).json({ ok: true, count: rows.length, imageCount: imageRows.length });
}
