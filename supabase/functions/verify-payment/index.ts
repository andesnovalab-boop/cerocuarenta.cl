// Edge Function: verify-payment  (port de GET /api/checkout/verify-payment)
// La usa la página Success: MP envía payment_id como query param.
// markOrderPaid es idempotente: si el webhook ya procesó, no duplica.
import { cors, json } from "../_shared/cors.ts";
import { getPayment } from "../_shared/mp.ts";
import { markOrderPaid } from "../_shared/orders.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const url = new URL(req.url);
    const body = await req.json().catch(() => ({} as any));
    const paymentId = body?.payment_id || url.searchParams.get("payment_id");
    if (!paymentId) return json({ error: "payment_id required" }, 400);

    const paymentData = await getPayment(String(paymentId));
    if (paymentData.status === "approved") {
      const orderId = paymentData.external_reference;
      if (!orderId) return json({ error: "external_reference missing" }, 400);
      await markOrderPaid(orderId, String(paymentId), paymentData);
      return json({ status: "paid", orderId });
    }
    return json({ status: paymentData.status });
  } catch (error: any) {
    return json({ error: error?.message || "Error" }, 500);
  }
});
