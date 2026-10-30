import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
export const config = { api: { bodyParser: false } };
const db = () => createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
async function rawBody(req) {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === "string") return Buffer.from(req.body, "utf8");
  const chunks = []; for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}
function equalHex(value, expected) {
  if (!/^[a-f0-9]{64}$/i.test(value || "")) return false;
  const a = Buffer.from(value, "hex"), b = Buffer.from(expected, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function verify(raw, req, secret) {
  const sig = String(req.headers["x-gateway-signature"] || "").replace(/^sha256=/i, "");
  if (!equalHex(sig, crypto.createHmac("sha256", secret).update(raw).digest("hex"))) return false;
  if (req.headers["x-gateway-signature-v2"]) {
    const ts = String(req.headers["x-gateway-timestamp"] || "");
    const sig2 = String(req.headers["x-gateway-signature-v2"]).replace(/^sha256=/i, "");
    if (!ts || !equalHex(sig2, crypto.createHmac("sha256", secret).update(`${ts}.${raw.toString("utf8")}`).digest("hex"))) return false;
  }
  return true;
}
const paise = (v) => Math.round(Number(v) * 100);
const successLike = new Set(["SUCCESS", "OBSERVED_SUCCESS", "RECONCILED", "MANUAL_REVIEW"]);
const allowed = new Set([...successLike, "FAILED", "EXPIRED", "CANCELLED"]);
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.YOUPI_WEBHOOK_SECRET) return res.status(503).json({ error: "Webhook is not configured" });
  let raw; try { raw = await rawBody(req); } catch { return res.status(400).json({ error: "Could not read request body" }); }
  if (!verify(raw, req, process.env.YOUPI_WEBHOOK_SECRET)) return res.status(401).json({ error: "Invalid webhook signature" });
  let event; try { event = JSON.parse(raw.toString("utf8")); } catch { return res.status(400).json({ error: "Invalid JSON payload" }); }
  const orderId = String(event.orderId || ""), name = String(event.event || "").toUpperCase();
  const headerEvent = String(req.headers["x-gateway-event"] || "").toUpperCase();
  const headerDelivery = String(req.headers["x-gateway-delivery-id"] || "");
  const deliveryId = String(event.deliveryId || headerDelivery).slice(0, 160);
  if (!/^DK-[0-9a-f-]{36}$/i.test(orderId) || !deliveryId || !allowed.has(name)) return res.status(400).json({ error: "Missing or invalid payment event fields" });
  if ((headerEvent && headerEvent !== name) || (headerDelivery && headerDelivery !== String(event.deliveryId || ""))) return res.status(400).json({ error: "Webhook headers do not match the signed payload" });
  const client = db();
  try {
    const { data: order, error: readError } = await client.from("orders").select("id,pay_now_amount,payment_status,gateway_payment_id").eq("id", orderId).maybeSingle();
    if (readError) throw new Error("Unable to load order");
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (successLike.has(name)) {
      const amount = Number.isSafeInteger(Number(event.amountPaise)) ? Number(event.amountPaise) : paise(event.amount);
      if (!Number.isSafeInteger(amount) || amount !== paise(order.pay_now_amount)) return res.status(409).json({ error: "Payment amount does not match the order" });
      if (!event.paymentId || !order.gateway_payment_id || String(event.paymentId) !== order.gateway_payment_id) return res.status(409).json({ error: "Payment session does not match the order" });
    }
    if (order.payment_status === "paid") return res.status(200).json({ received: true, duplicate: true });
    const { error: insertError } = await client.from("payment_webhook_events").insert({ delivery_id: deliveryId, order_id: orderId, event_name: name, received_at: new Date().toISOString() });
    if (insertError) { if (insertError.code === "23505") return res.status(200).json({ received: true, duplicate: true }); throw new Error("Unable to record webhook delivery"); }
    const patch = { updated_at: new Date().toISOString() };
    if (name === "RECONCILED" && event.settlementState === "RECONCILED") {
      patch.payment_status = "paid"; patch.paid_at = new Date().toISOString(); patch.gateway_utr = String(event.utr || "").slice(0, 80) || null;
    } else if (name === "SUCCESS" || name === "OBSERVED_SUCCESS") patch.payment_status = "observed_success";
    else if (name === "MANUAL_REVIEW") patch.payment_status = "manual_review";
    else patch.payment_status = name.toLowerCase();
    const { error: updateError } = await client.from("orders").update(patch).eq("id", orderId).neq("payment_status", "paid");
    if (updateError) { await client.from("payment_webhook_events").delete().eq("delivery_id", deliveryId); throw new Error("Unable to update order payment status"); }
    return res.status(200).json({ received: true, paid: patch.payment_status === "paid" });
  } catch (error) {
    console.error("YouPI webhook processing failed", { message: error?.message });
    return res.status(500).json({ error: "Webhook processing failed; gateway may retry" });
  }
}
