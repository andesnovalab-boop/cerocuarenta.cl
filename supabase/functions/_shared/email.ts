// Envío del email de confirmación vía Resend (port de sendOrderEmail en server.ts).
// Devuelve el estado real para registrarlo en la tabla `emails`.
export async function sendOrderEmail(order: any): Promise<"sent" | "failed" | "skipped"> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM") || "CeroCuarenta <onboarding@resend.dev>";
  const replyTo = Deno.env.get("RESEND_REPLY_TO") || "contacto@cerocuarenta.cl";
  if (!apiKey || !order?.customer_email) return "skipped";

  const clp = (n: number) => `$${Number(n || 0).toLocaleString("es-CL")}`;

  const LOGO_URL = "https://bnselsqkorrycugymcij.supabase.co/storage/v1/object/public/product-images/brand/logo-blanco.png";
  const SUPPORT_EMAIL = "contacto@cerocuarenta.cl";
  const WHATSAPP = "56950081657";
  const INSTAGRAM = "https://www.instagram.com/cerocuarenta.cl/";

  const addr = order.shipping_address || {};
  const firstName = String(addr.full_name || "").trim().split(" ")[0] || "";
  const isRM = addr.region === "Región Metropolitana de Santiago";
  const eta = isRM ? "2 a 5 días hábiles" : "5 a 8 días hábiles";
  const fullAddress = addr.address || [addr.street, addr.street_number, addr.apartment].filter(Boolean).join(", ");

  const rows = (order.items || []).map((i: any) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee;">${i.name}${i.selectedSize ? ` · Talla ${i.selectedSize}` : ""}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center;">x${i.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${clp(i.price * i.quantity)}</td>
      </tr>`).join("");

  const contactLinks = [
    `<a href="mailto:${SUPPORT_EMAIL}" style="color:#0a0a0a;font-weight:bold;">${SUPPORT_EMAIL}</a>`,
    WHATSAPP ? `<a href="https://wa.me/${WHATSAPP}" style="color:#0a0a0a;font-weight:bold;">WhatsApp</a>` : "",
    INSTAGRAM ? `<a href="${INSTAGRAM}" style="color:#0a0a0a;font-weight:bold;">Instagram</a>` : "",
  ].filter(Boolean).join(" &nbsp;·&nbsp; ");

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a;">
    <div style="background:#0a0a0a;padding:24px;text-align:center;">
      <img src="${LOGO_URL}" alt="CeroCuarenta" height="40" style="height:40px;width:auto;" />
    </div>
    <div style="padding:28px;">
      <h2 style="margin-top:0;">¡Gracias por tu compra${firstName ? `, ${firstName}` : ""}! 🎾</h2>
      <p>Tu pedido <b>#${order.id}</b> fue confirmado y está en preparación.</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;">${rows}
        <tr><td style="padding:10px 0;" colspan="2"><b>Envío</b></td><td style="padding:10px 0;text-align:right;">${clp(order.shipping_cost)}</td></tr>
        <tr><td style="padding:10px 0;font-size:16px;" colspan="2"><b>Total</b></td><td style="padding:10px 0;text-align:right;font-size:16px;"><b>${clp(order.total)}</b></td></tr>
      </table>
      <div style="background:#f7f7f7;border-radius:8px;padding:16px 18px;margin:20px 0;font-size:14px;">
        <p style="margin:0 0 6px;font-weight:bold;">📦 Envío a:</p>
        <p style="margin:0;line-height:1.6;color:#444;">
          ${addr.full_name || ""}<br>
          ${fullAddress}<br>
          ${[addr.commune, addr.region].filter(Boolean).join(", ")}${addr.phone ? `<br>Tel: ${addr.phone}` : ""}
        </p>
        <p style="margin:12px 0 0;color:#444;">🚚 Entrega estimada: <b>${eta}</b></p>
      </div>
      <p style="color:#666;font-size:13px;">Te avisaremos cuando tu pedido sea despachado. ¿Dudas? Escríbenos: ${contactLinks}</p>
    </div>
    <div style="background:#0a0a0a;padding:18px;text-align:center;color:#888;font-size:12px;">
      CeroCuarenta · Tennis Streetwear · Santiago, Chile
    </div>
  </div>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: order.customer_email,
        reply_to: replyTo,
        subject: `Confirmación de tu pedido #${order.id} — CeroCuarenta`,
        html,
      }),
    });
    if (!res.ok) { console.error("Resend error:", res.status, await res.text()); return "failed"; }
    return "sent";
  } catch (err) {
    console.error("Resend exception:", err);
    return "failed";
  }
}
