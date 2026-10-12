import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { getCookie, verifySession, COOKIE_NAME } from "../lib/auth.js";

const getDb = () => createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const safeName = (name = "image") => {
  const cleaned = String(name)
    .split(/[\\/]/).pop()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100);
  return cleaned || "image";
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!verifySession(getCookie(req, COOKIE_NAME))) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: "Supabase environment variables are missing." });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const contentType = String(body?.contentType || "").toLowerCase();
  const fileName = safeName(body?.fileName || "image");
  if (!contentType.startsWith("image/")) {
    return res.status(400).json({ error: "Only image files are allowed." });
  }

  const ext = fileName.includes(".") ? fileName.split(".").pop() : "webp";
  const path = `products/${crypto.randomUUID()}.${ext}`;
  const db = getDb();
  const { data, error } = await db.storage
    .from("product-images")
    .createSignedUploadUrl(path);

  if (error) return res.status(500).json({ error: error.message });
  const { data: publicData } = db.storage.from("product-images").getPublicUrl(path);

  return res.status(200).json({
    path,
    token: data?.token,
    publicUrl: publicData?.publicUrl || "",
  });
}
