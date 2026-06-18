// Envía un email de confirmación de PRUEBA (misma plantilla que server.ts).
// Uso: node scripts/test-email.mjs [destinatario]
import "dotenv/config";

const TO = process.argv[2] || "juanplazabravo@gmail.com";
const apiKey = process.env.RESEND_API_KEY;
const fromConfigured = process.env.RESEND_FROM || "CeroCuarenta <onboarding@resend.dev>";

if (!apiKey) {
  console.error("RESEND_API_KEY no configurada en .env");
  process.exit(1);
}

// Pedido de ejemplo (incluye dirección como en producción)
const order = {
  id: "TEST-1042",
  customer_email: TO,
  shipping_cost: 3990,
  total: 49970,
  shipping_address: {
    full_name: "Juan Plaza Bravo",
    address: "Av. Providencia 1234, Depto 56",
    commune: "Providencia",
    region: "Región Metropolitana de Santiago",
    phone: "+56 9 8765 4321",
  },
  items: [
    { name: "Polera Vintage Court", selectedSize: "M", quantity: 1, price: 25990 },
    { name: "Gorro Tennis Club", selectedSize: "Única", quantity: 1, price: 19990 },
  ],
};

// ── Misma plantilla que sendOrderEmail() en server.ts ──
const LOGO_URL = "https://bnselsqkorrycugymcij.supabase.co/storage/v1/object/public/product-images/brand/logo-blanco.png";
const SUPPORT_EMAIL = "contacto@cerocuarenta.cl";
const WHATSAPP = "56950081657";   // mantener en sync con server.ts
const INSTAGRAM = "https://www.instagram.com/cerocuarenta.cl/";

const clp = (n) => `$${Number(n || 0).toLocaleString("es-CL")}`;
const addr = order.shipping_address || {};
const firstName = String(addr.full_name || "").trim().split(" ")[0] || "";
const isRM = addr.region === "Región Metropolitana de Santiago";
const eta = isRM ? "2 a 5 días hábiles" : "5 a 8 días hábiles";
const fullAddress = addr.address || [addr.street, addr.street_number, addr.apartment].filter(Boolean).join(", ");

const rows = (order.items || [])
  .map((i) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #eee;">${i.name}${i.selectedSize ? ` · Talla ${i.selectedSize}` : ""}</td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center;">x${i.quantity}</td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${clp(i.price * i.quantity)}</td>
    </tr>`)
  .join("");

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

async function send(from) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: TO,
      subject: `Confirmación de tu pedido #${order.id} — CeroCuarenta`,
      html,
    }),
  });
  return { ok: res.ok, status: res.status, body: await res.text() };
}

let r = await send(fromConfigured);
if (!r.ok && /domain|verif|not found/i.test(r.body)) {
  console.log(`⚠️ Falló con "${fromConfigured}" (dominio sin verificar). Reintentando con onboarding@resend.dev...`);
  r = await send("CeroCuarenta <onboarding@resend.dev>");
}

if (r.ok) {
  console.log(`✅ Email enviado a ${TO}`);
  console.log(r.body);
} else {
  console.error(`❌ Error ${r.status}:`);
  console.error(r.body);
  process.exit(1);
}
