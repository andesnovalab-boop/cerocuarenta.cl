// Edge Function: checkout-mp  (port de POST /api/checkout/mp)
// Crea la preferencia de MercadoPago. Recalcula precios, envío y valida stock
// SIEMPRE desde la BD — nunca confía en lo que manda el cliente.
import { cors, json } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supa.ts";
import { createPreference } from "../_shared/mp.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { items, shippingAddress, shippingMethod, customerEmail, userId } = await req.json();
    const appUrl = Deno.env.get("APP_URL") || "https://cerocuarenta.cl";
    if (!Deno.env.get("MP_ACCESS_TOKEN")) return json({ error: "MercadoPago no configurado" }, 500);
    if (!items?.length) return json({ error: "Carrito vacío" }, 400);

    // Crear la orden con service-role (evita problemas de RLS-returning en compras de invitado).
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: userId || null,
        customer_email: customerEmail || null,
        items,
        subtotal: 0, shipping_cost: 0, total: 0, // se recalculan abajo desde la BD
        status: "pending",
        shipping_address: shippingAddress,
        shipping_method: shippingMethod,
      })
      .select("id, items, customer_email, shipping_address")
      .single();
    if (orderErr || !order) return json({ error: orderErr?.message || "No se pudo crear la orden" }, 500);
    const orderId = order.id;

    const orderItems = order.items as any[];
    const itemIds = orderItems.map((i) => i.id);
    const { data: products } = await supabaseAdmin
      .from("products").select("id, price, name, stock, sizes").in("id", itemIds);
    const productMap = Object.fromEntries((products || []).map((p: any) => [String(p.id), p]));

    const mpItems = orderItems.map((item: any) => {
      const product = productMap[String(item.id)];
      if (!product) throw new Error(`Producto ${item.id} no encontrado en BD`);
      const sizeStock = product.sizes?.[item.selectedSize] ?? product.stock ?? 0;
      if (Number(item.quantity) > Number(sizeStock)) {
        throw new Error(`Stock insuficiente para ${product.name} talla ${item.selectedSize}`);
      }
      return {
        id: String(item.id), title: product.name as string,
        quantity: Number(item.quantity), unit_price: Number(product.price), currency_id: "CLP",
      };
    });

    // Recalcular envío server-side (réplica de la regla del checkout)
    const subtotalReal = mpItems.reduce((s, i) => s + i.unit_price * i.quantity, 0);
    const { data: shippingSettings } = await supabaseAdmin
      .from("shipping_settings").select("rm, region, free_shipping_threshold").limit(1).single();
    const threshold = shippingSettings?.free_shipping_threshold;
    let shippingCost = 0;
    if (!(threshold && subtotalReal >= Number(threshold))) {
      const region = (order.shipping_address as any)?.region;
      const isRM = region === "Región Metropolitana de Santiago";
      shippingCost = isRM
        ? Number((shippingSettings?.rm as any)?.price ?? 3990)
        : Number((shippingSettings?.region as any)?.price ?? 6990);
    }

    await supabaseAdmin.from("orders")
      .update({ subtotal: subtotalReal, shipping_cost: shippingCost, total: subtotalReal + shippingCost })
      .eq("id", orderId);

    if (shippingCost > 0) {
      mpItems.push({ id: "shipping", title: "Envío", quantity: 1, unit_price: shippingCost, currency_id: "CLP" });
    }

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
  } catch (error: any) {
    console.error("checkout-mp error:", error?.message || error);
    return json({ error: error?.message || "Error" }, 500);
  }
});
