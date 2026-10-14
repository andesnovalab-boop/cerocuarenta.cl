// MercadoPago vía API REST (sin SDK npm — Deno usa fetch directo).
const token = () => Deno.env.get("MP_ACCESS_TOKEN") || "";

export async function createPreference(body: unknown) {
  const r = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`MP preference ${r.status}: ${await r.text()}`);
  return await r.json();
}

export async function getPayment(id: string) {
  const r = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
    headers: { Authorization: `Bearer ${token()}` },
  });
  if (!r.ok) throw new Error(`MP payment ${r.status}: ${await r.text()}`);
  return await r.json();
}

// Valida la firma del webhook (réplica de validateMPSignature en server.ts).
export async function validateSignature(req: Request, dataId: string): Promise<boolean> {
  const secret = Deno.env.get("MP_WEBHOOK_SECRET");
  if (!secret) return false; // en producción siempre exigimos secret
  const signature = req.headers.get("x-signature") || "";
  const requestId = req.headers.get("x-request-id") || "";
  const ts = signature.match(/ts=([^,]+)/)?.[1];
  const v1 = signature.match(/v1=([^,]+)/)?.[1];
  if (!ts || !v1) return false;

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(manifest));
  const hex = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return hex === v1;
}
