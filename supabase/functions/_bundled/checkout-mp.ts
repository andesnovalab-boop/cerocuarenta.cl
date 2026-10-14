// ============================================================
//  checkout-mp  (versión AUTOCONTENIDA para pegar en el Dashboard de Supabase)
//  Crea la preferencia de pago de Mercado Pago. Recalcula precios/envío/stock
//  desde la BD; nunca confía en lo que manda el cliente.
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function createPreference(body: unknown) {
  const r = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: { Authorization: `Bearer ${Deno.env.get("MP_ACCESS_TOKEN")}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`MP preference ${r.status}: ${await r.text()}`);
  return await r.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { items, shippingAddress, shippingMethod, customerEmail, userId } = await req.json();
    const appUrl = Deno.env.get("APP_URL") || "https://cerocuarenta.cl";
    if (!Deno.env.get("MP_ACCESS_TOKEN")) return json({ error: "MercadoPago no configurado" }, 500);
    if (!items?.length) return json({ error: "Carrito vacío" }, 400);

    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: userId || null, customer_email: customerEmail || null, items,
        subtotal: 0, shipping_cost: 0, total: 0, status: "pending",
        shipping_address: shippingAddress, shipping_method: shippingMethod,
      })
      .select("id, items, customer_email, shipping_address").single();
    if (orderErr || !order) return json({ error: orderErr?.message || "No se pudo crear la orden" }, 500);
    const orderId = order.id;

    const orderItems = order.items as any[];
    const { data: products } = await supabaseAdmin
      .from("products").select("id, price, name, stock, sizes").in("id", orderItems.map((i) => i.id));
    const productMap = Object.fromEntries((products || []).map((p: any) => [String(p.id), p]));

    const mpItems = orderItems.map((item: any) => {
      const product = productMap[String(item.id)];
      if (!product) throw new Error(`Producto ${item.id} no encontrado`);
      const sizeStock = product.sizes?.[item.selectedSize] ?? product.stock ?? 0;
      if (Number(item.quantity) > Number(sizeStock)) throw new Error(`Stock insuficiente para ${product.name}`);
      return { id: String(item.id), title: product.name, quantity: Number(item.quantity), unit_price: Number(product.price), currency_id: "CLP" };
    });

    const subtotalReal = mpItems.reduce((s, i) => s + i.unit_price * i.quantity, 0);
    const { data: ship } = await supabaseAdmin.from("shipping_settings").select("rm, region, free_shipping_threshold").limit(1).single();
    const threshold = ship?.free_shipping_threshold;
    let shippingCost = 0;
    if (!(threshold && subtotalReal >= Number(threshold))) {
      const isRM = (order.shipping_address as any)?.region === "Región Metropolitana de Santiago";
      shippingCost = isRM ? Number((ship?.rm as any)?.price ?? 3990) : Number((ship?.region as any)?.price ?? 6990);
    }
    await supabaseAdmin.from("orders").update({ subtotal: subtotalReal, shipping_cost: shippingCost, total: subtotalReal + shippingCost }).eq("id", orderId);
    if (shippingCost > 0) mpItems.push({ id: "shipping", title: "Envío", quantity: 1, unit_price: shippingCost, currency_id: "CLP" });

    const result = await createPreference({
      items: mpItems,
      payer: { email: order.customer_email || customerEmail },
      external_reference: orderId,
      back_urls: { success: `${appUrl}/success`, failure: `${appUrl}/checkout`, pending: `${appUrl}/success` },
      ...(appUrl.startsWith("https") && { auto_return: "approved" }),
      notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mp-webhook`,
      statement_descriptor: "CEROCUARENTA",
    });
    return json({ url: result.init_point });
  } catch (e: any) {
    console.error("checkout-mp:", e?.message || e);
    return json({ error: e?.message || "Error" }, 500);
  }
});
