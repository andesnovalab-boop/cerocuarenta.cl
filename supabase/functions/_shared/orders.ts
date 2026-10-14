// markOrderPaid: idempotente y atómico (port de server.ts).
// El guard eq("status","pending") garantiza que SOLO la primera transición
// pending→paid descuenta stock y encola el email.
import { supabaseAdmin } from "./supa.ts";
import { sendOrderEmail } from "./email.ts";

export async function markOrderPaid(orderId: string, paymentId: string, paymentData?: any) {
  const update: Record<string, any> = {
    status: "paid",
    payment_id: String(paymentId),
    paid_at: new Date().toISOString(),
  };
  if (paymentData) update.payment_data = paymentData;

  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .update(update)
    .eq("id", orderId)
    .eq("status", "pending") // guard atómico
    .select()
    .single();

  if (error || !order) return { alreadyPaid: true as const };

  // Descontar stock por talla (solo una vez)
  for (const item of order.items || []) {
    const { data: product } = await supabaseAdmin
      .from("products").select("sizes, stock").eq("id", item.id).single();
    if (product) {
      const currentSizes = product.sizes || {};
      const newSizeStock = Math.max(0, (currentSizes[item.selectedSize] || 0) - item.quantity);
      const newTotalStock = Math.max(0, (product.stock || 0) - item.quantity);
      await supabaseAdmin.from("products")
        .update({ sizes: { ...currentSizes, [item.selectedSize]: newSizeStock }, stock: newTotalStock })
        .eq("id", item.id);
    }
  }

  // Email de confirmación + registro del estado real
  const emailStatus = await sendOrderEmail(order);
  await supabaseAdmin.from("emails").insert({
    to_email: order.customer_email,
    subject: `Confirmación de Pedido #${orderId} - CeroCuarenta`,
    template: "order_confirmation",
    order_id: orderId,
    sent_at: emailStatus === "sent" ? new Date().toISOString() : null,
    status: emailStatus,
  });

  return { justPaid: true as const, order };
}
