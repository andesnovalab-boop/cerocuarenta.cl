// Edge Function: mp-webhook  (port de POST /api/webhooks/mp)
// Recibe la notificación de MercadoPago, valida la firma, y marca la orden
// como pagada (idempotente). Deploy con --no-verify-jwt (MP no manda JWT).
import { cors } from "../_shared/cors.ts";
import { getPayment, validateSignature } from "../_shared/mp.ts";
import { markOrderPaid } from "../_shared/orders.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const url = new URL(req.url);
    const body = await req.json().catch(() => ({} as any));
    const type = body.type || url.searchParams.get("type") || url.searchParams.get("topic");
    const dataId = body?.data?.id || url.searchParams.get("data.id") || url.searchParams.get("id") || "";

    // Validar firma (réplica de validateMPSignature)
    if (!(await validateSignature(req, String(dataId)))) {
      console.warn("MP Webhook: firma inválida rechazada");
      return new Response("unauthorized", { status: 401, headers: cors });
    }

    if (type === "payment" && dataId) {
      const paymentData = await getPayment(String(dataId));
      if (paymentData.status === "approved") {
        const orderId = paymentData.external_reference;
        if (orderId) await markOrderPaid(orderId, String(dataId), paymentData);
      }
    }
    return new Response("ok", { status: 200, headers: cors });
  } catch (error) {
    console.error("mp-webhook error:", error);
    return new Response("ok", { status: 200, headers: cors }); // 200 para que MP no reintente en bucle
  }
});
