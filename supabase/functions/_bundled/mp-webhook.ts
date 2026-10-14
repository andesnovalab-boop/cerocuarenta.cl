// ============================================================
//  mp-webhook  (AUTOCONTENIDA para pegar en el Dashboard de Supabase)
//  Recibe la notificación de Mercado Pago, valida la firma y marca la orden
//  como pagada. IMPORTANTE: al desplegar, desactiva "Verify JWT" (MP no manda JWT).
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-signature, x-request-id",
};

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function getPayment(id: string) {
  const r = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
    headers: { Authorization: `Bearer ${Deno.env.get("MP_ACCESS_TOKEN")}` },
  });
  if (!r.ok) throw new Error(`MP payment ${r.status}`);
  return await r.json();
}

async function validateSignature(req: Request, dataId: string): Promise<boolean> {
  const secret = Deno.env.get("MP_WEBHOOK_SECRET");
  if (!secret) return false;
  const signature = req.headers.get("x-signature") || "";
  const requestId = req.headers.get("x-request-id") || "";
  const ts = signature.match(/ts=([^,]+)/)?.[1];
  const v1 = signature.match(/v1=([^,]+)/)?.[1];
  if (!ts || !v1) return false;
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(manifest));
  const hex = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return hex === v1;
}

async function sendOrderEmail(order: any): Promise<"sent" | "failed" | "skipped"> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM") || "CeroCuarenta <onboarding@resend.dev>";
  const replyTo = Deno.env.get("RESEND_REPLY_TO") || "contacto@cerocuarenta.cl";
  if (!apiKey || !order?.customer_email) return "skipped";
  const clp = (n: number) => `$${Number(n || 0).toLocaleString("es-CL")}`;
  const rows = (order.items || []).map((i: any) =>
    `<tr><td style="padding:8px 0;border-bottom:1px solid #eee;">${i.name}${i.selectedSize ? ` · Talla ${i.selectedSize}` : ""}</td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center;">x${i.quantity}</td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${clp(i.price * i.quantity)}</td></tr>`).join("");
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a;"><div style="background:#0a0a0a;padding:24px;text-align:center;"><img src="https://bnselsqkorrycugymcij.supabase.co/storage/v1/object/public/product-images/brand/logo-blanco.png" alt="CeroCuarenta" height="40"></div><div style="padding:28px;"><h2>¡Gracias por tu compra! 🎾</h2><p>Tu pedido <b>#${order.id}</b> fue confirmado y está en preparación.</p><table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;">${rows}<tr><td colspan="2" style="padding:10px 0;"><b>Envío</b></td><td style="padding:10px 0;text-align:right;">${clp(order.shipping_cost)}</td></tr><tr><td colspan="2" style="padding:10px 0;font-size:16px;"><b>Total</b></td><td style="padding:10px 0;text-align:right;font-size:16px;"><b>${clp(order.total)}</b></td></tr></table><p style="color:#666;font-size:13px;">¿Dudas? Escríbenos a contacto@cerocuarenta.cl</p></div><div style="background:#0a0a0a;padding:18px;text-align:center;color:#888;font-size:12px;">CeroCuarenta · Tennis Streetwear · Santiago, Chile</div></div>`;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: order.customer_email, reply_to: replyTo, subject: `Confirmación de tu pedido #${order.id} — CeroCuarenta`, html }),
    });
    return res.ok ? "sent" : "failed";
  } catch { return "failed"; }
}

async function markOrderPaid(orderId: string, paymentId: string, paymentData?: any) {
  const update: Record<string, any> = { status: "paid", payment_id: String(paymentId), paid_at: new Date().toISOString() };
  if (paymentData) update.payment_data = paymentData;
  const { data: order, error } = await supabaseAdmin.from("orders").update(update).eq("id", orderId).eq("status", "pending").select().single();
  if (error || !order) return;
  for (const item of order.items || []) {
    const { data: product } = await supabaseAdmin.from("products").select("sizes, stock").eq("id", item.id).single();
    if (product) {
      const cs = product.sizes || {};
      await supabaseAdmin.from("products").update({
        sizes: { ...cs, [item.selectedSize]: Math.max(0, (cs[item.selectedSize] || 0) - item.quantity) },
        stock: Math.max(0, (product.stock || 0) - item.quantity),
      }).eq("id", item.id);
    }
  }
  const emailStatus = await sendOrderEmail(order);
  await supabaseAdmin.from("emails").insert({
    to_email: order.customer_email, subject: `Confirmación de Pedido #${orderId} - CeroCuarenta`,
    template: "order_confirmation", order_id: orderId,
    sent_at: emailStatus === "sent" ? new Date().toISOString() : null, status: emailStatus,
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const url = new URL(req.url);
    const body = await req.json().catch(() => ({} as any));
    const type = body.type || url.searchParams.get("type") || url.searchParams.get("topic");
    const dataId = body?.data?.id || url.searchParams.get("data.id") || url.searchParams.get("id") || "";
    if (!(await validateSignature(req, String(dataId)))) {
      console.warn("MP Webhook: firma inválida");
      return new Response("unauthorized", { status: 401, headers: cors });
    }
    if (type === "payment" && dataId) {
      const pay = await getPayment(String(dataId));
      if (pay.status === "approved" && pay.external_reference) {
        await markOrderPaid(pay.external_reference, String(dataId), pay);
      }
    }
    return new Response("ok", { status: 200, headers: cors });
  } catch (e) {
    console.error("mp-webhook:", e);
    return new Response("ok", { status: 200, headers: cors });
  }
});
