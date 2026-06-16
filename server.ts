import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createHmac } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

// ── Startup guard: variables críticas de producción ─────────
if (process.env.NODE_ENV === "production") {
  const required = ["MP_ACCESS_TOKEN", "MP_WEBHOOK_SECRET", "SUPABASE_SERVICE_ROLE_KEY", "APP_URL"];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length) {
    console.error(`[FATAL] Variables de entorno faltantes en producción: ${missing.join(", ")}`);
    process.exit(1);
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase Admin Client (server-side, uses service role key)
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// MercadoPago Client
const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || ''
});

function validateMPSignature(req: express.Request): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[Security] MP_WEBHOOK_SECRET no configurado — webhook rechazado');
      return false;
    }
    return true; // solo en dev sin secret
  }

  const signature = req.headers["x-signature"] as string;
  const requestId = req.headers["x-request-id"] as string;
  if (!signature) return false;

  const ts = signature.match(/ts=([^,]+)/)?.[1];
  const v1 = signature.match(/v1=([^,]+)/)?.[1];
  if (!ts || !v1) return false;

  const dataId = req.body?.data?.id ?? "";
  const manifest = `id:${dataId};request-id:${requestId ?? ""};ts:${ts};`;
  const hmac = createHmac("sha256", secret).update(manifest).digest("hex");

  return hmac === v1;
}

// ── Envío de email de confirmación vía Resend ───────────────
// Devuelve el estado real para registrarlo en la tabla `emails`.
// Si no hay RESEND_API_KEY configurada, no inventa un "sent": devuelve "skipped".
async function sendOrderEmail(order: any): Promise<"sent" | "failed" | "skipped"> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || "CeroCuarenta <onboarding@resend.dev>";
  if (!apiKey || !order?.customer_email) return "skipped";

  const clp = (n: number) => `$${Number(n || 0).toLocaleString("es-CL")}`;
  const rows = (order.items || [])
    .map((i: any) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee;">${i.name}${i.selectedSize ? ` · Talla ${i.selectedSize}` : ""}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center;">x${i.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${clp(i.price * i.quantity)}</td>
      </tr>`)
    .join("");

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a;">
    <div style="background:#0a0a0a;padding:28px;text-align:center;">
      <h1 style="color:#d4ff3f;margin:0;font-style:italic;">CeroCuarenta</h1>
    </div>
    <div style="padding:28px;">
      <h2 style="margin-top:0;">¡Gracias por tu compra! 🎾</h2>
      <p>Tu pedido <b>#${order.id}</b> fue confirmado y está en preparación.</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;">${rows}
        <tr><td style="padding:10px 0;" colspan="2"><b>Envío</b></td><td style="padding:10px 0;text-align:right;">${clp(order.shipping_cost)}</td></tr>
        <tr><td style="padding:10px 0;font-size:16px;" colspan="2"><b>Total</b></td><td style="padding:10px 0;text-align:right;font-size:16px;"><b>${clp(order.total)}</b></td></tr>
      </table>
      <p style="color:#666;font-size:13px;">Te avisaremos cuando tu pedido sea despachado. Cualquier duda, responde a este correo.</p>
    </div>
    <div style="background:#f5f5f5;padding:16px;text-align:center;color:#999;font-size:12px;">CeroCuarenta · Santiago, Chile</div>
  </div>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: order.customer_email,
        subject: `Confirmación de tu pedido #${order.id} — CeroCuarenta`,
        html,
      }),
    });
    if (!res.ok) {
      console.error("Resend error:", res.status, await res.text());
      return "failed";
    }
    return "sent";
  } catch (err) {
    console.error("Resend exception:", err);
    return "failed";
  }
}

// ── Marcar orden pagada: idempotente y atómico ──────────────
// El guard `eq("status","pending")` garantiza que SOLO el primer
// llamado que transiciona pending→paid descuente stock y encole el
// email. Evita la doble ejecución entre el webhook y verify-payment.
async function markOrderPaid(orderId: string, paymentId: string, paymentData?: any) {
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
    .eq("status", "pending")   // guard atómico: nadie más ganó la carrera
    .select()
    .single();

  // Sin filas afectadas → ya estaba pagada (otra ruta la procesó). No reprocesar.
  if (error || !order) return { alreadyPaid: true as const };

  // Descontar stock por talla (solo una vez, garantizado por el guard)
  for (const item of order.items || []) {
    const { data: product } = await supabaseAdmin
      .from("products")
      .select("sizes, stock")
      .eq("id", item.id)
      .single();

    if (product) {
      const currentSizes = product.sizes || {};
      const newSizeStock = Math.max(0, (currentSizes[item.selectedSize] || 0) - item.quantity);
      const newTotalStock = Math.max(0, (product.stock || 0) - item.quantity);

      await supabaseAdmin
        .from("products")
        .update({ sizes: { ...currentSizes, [item.selectedSize]: newSizeStock }, stock: newTotalStock })
        .eq("id", item.id);
    }
  }

  // Enviar email de confirmación y registrar el estado REAL del envío
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

// ── Rate limiter en memoria (sin dependencias externas) ─────
const checkoutAttempts = new Map<string, { count: number; resetAt: number }>();

function checkoutRateLimit(req: express.Request, res: express.Response, next: express.NextFunction) {
  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim()
    || req.socket.remoteAddress
    || "unknown";
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // ventana de 10 min
  const maxPerWindow = 5;

  const entry = checkoutAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    checkoutAttempts.set(ip, { count: 1, resetAt: now + windowMs });
    return next();
  }
  if (entry.count >= maxPerWindow) {
    return res.status(429).json({ error: "Demasiados intentos. Espera unos minutos." });
  }
  entry.count++;
  next();
}

// Limpia entradas expiradas cada 30 minutos para evitar memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of checkoutAttempts.entries()) {
    if (now > entry.resetAt) checkoutAttempts.delete(ip);
  }
}, 30 * 60 * 1000);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === "production";
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://cerocuarenta.cl",
    "https://www.cerocuarenta.cl",
  ];

  // ── Headers de seguridad HTTP ──────────────────────────────
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
    if (isProd) {
      res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
    }
    next();
  });

  // ── CORS ──────────────────────────────────────────────────
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });

  app.use(express.json());

  app.use((req, _res, next) => {
    if (req.path.startsWith("/api/")) console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
    next();
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // ── Admin auth middleware ────────────────────────────────
  async function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Sin token" });
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: "Token inválido" });
    const { data: profile } = await supabaseAdmin.from("users").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") return res.status(403).json({ error: "Sin permisos de admin" });
    next();
  }

  // ── Admin: Shipping settings ────────────────────────────
  app.post("/api/admin/shipping", requireAdmin, async (req, res) => {
    const { id, rm, region, free_shipping_threshold, conditions } = req.body;
    const { error } = await supabaseAdmin.from("shipping_settings").upsert({ id, rm, region, free_shipping_threshold, conditions, updated_at: new Date().toISOString() });
    if (error) { console.error("Admin shipping error:", error); return res.status(500).json({ error: error.message }); }
    res.json({ ok: true });
  });

  // ── Admin: Blog posts ───────────────────────────────────
  app.post("/api/admin/blog", requireAdmin, async (req, res) => {
    const { id, ...fields } = req.body;
    const { data, error } = id
      ? await supabaseAdmin.from("blog_posts").update(fields).eq("id", id).select().single()
      : await supabaseAdmin.from("blog_posts").insert(fields).select().single();
    if (error) { console.error("Admin blog error:", error); return res.status(500).json({ error: error.message }); }
    res.json(data);
  });

  app.delete("/api/admin/blog/:id", requireAdmin, async (req, res) => {
    const { error } = await supabaseAdmin.from("blog_posts").delete().eq("id", req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ ok: true });
  });

  app.patch("/api/admin/blog/:id/publish", requireAdmin, async (req, res) => {
    const { published } = req.body;
    const { error } = await supabaseAdmin.from("blog_posts").update({ published }).eq("id", req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ ok: true });
  });

  // ── Admin: Create product ───────────────────────────────
  app.post("/api/admin/products", requireAdmin, async (req, res) => {
    const { data, error } = await supabaseAdmin.from("products").insert(req.body).select().single();
    if (error) { console.error("Admin create product:", error); return res.status(500).json({ error: error.message }); }
    res.json(data);
  });

  // ── Admin: Upload image to storage ──────────────────────
  app.post("/api/admin/upload", requireAdmin, async (req, res) => {
    try {
      const { base64, fileName, mimeType } = req.body;
      if (!base64 || !fileName) return res.status(400).json({ error: "base64 y fileName requeridos" });
      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
      if (!allowedTypes.includes(mimeType)) return res.status(415).json({ error: "Tipo de archivo no permitido (solo imágenes)" });
      if (base64.length > 10 * 1024 * 1024) return res.status(413).json({ error: "Imagen demasiado grande (máx 7.5 MB)" });
      const buffer = Buffer.from(base64, "base64");
      const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}-${fileName}`;
      const { error } = await supabaseAdmin.storage.from("product-images").upload(uniqueName, buffer, { contentType: mimeType || "image/jpeg" });
      if (error) return res.status(500).json({ error: error.message });
      const { data: { publicUrl } } = supabaseAdmin.storage.from("product-images").getPublicUrl(uniqueName);
      res.json({ url: publicUrl });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Admin: Orders clear ─────────────────────────────────
  app.delete("/api/admin/orders/clear", requireAdmin, async (req, res) => {
    const { error } = await supabaseAdmin.from("orders").delete().in("status", ["paid", "shipped"]);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ ok: true });
  });

  // ── Admin: Orders mark shipped ──────────────────────────
  app.patch("/api/admin/orders/:id/ship", requireAdmin, async (req, res) => {
    const { error } = await supabaseAdmin.from("orders").update({ status: "shipped" }).eq("id", req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ ok: true });
  });

  // Create order server-side (bypasses RLS with service role key)
  app.post("/api/checkout/create-order", checkoutRateLimit, async (req, res) => {
    try {
      const { customerEmail, userId, items, subtotal, shippingCost, total, shippingAddress, shippingMethod } = req.body;
      if (!items?.length) return res.status(400).json({ error: "Carrito vacío" });

      const { data: order, error } = await supabaseAdmin
        .from("orders")
        .insert({
          user_id: userId || null,
          customer_email: customerEmail || null,
          items,
          subtotal,
          shipping_cost: shippingCost,
          total,
          status: "pending",
          shipping_address: shippingAddress,
          shipping_method: shippingMethod,
        })
        .select()
        .single();

      if (error) {
        console.error("Create order error:", error);
        return res.status(500).json({ error: error.message });
      }
      res.json({ orderId: order.id });
    } catch (error: any) {
      console.error("Create order exception:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Create MercadoPago preference and return checkout URL
  app.post("/api/checkout/mp", checkoutRateLimit, async (req, res) => {
    try {
      const { orderId, customerEmail } = req.body;
      const appUrl = process.env.APP_URL || 'http://localhost:3000';

      if (!process.env.MP_ACCESS_TOKEN) {
        return res.status(500).json({ error: "MercadoPago no configurado" });
      }

      // Fetch order from DB — never trust client-provided totals or items
      const { data: order, error: orderErr } = await supabaseAdmin
        .from('orders')
        .select('id, items, shipping_cost, customer_email, status, shipping_address')
        .eq('id', orderId)
        .single();

      if (orderErr || !order) return res.status(400).json({ error: 'Orden no encontrada' });
      if (order.status !== 'pending') return res.status(400).json({ error: 'Orden ya procesada' });

      // Fetch real prices from products table
      const orderItems = order.items as any[];
      const itemIds = orderItems.map((i: any) => i.id);
      const { data: products } = await supabaseAdmin
        .from('products')
        .select('id, price, name, stock, sizes')
        .in('id', itemIds);

      const productMap = Object.fromEntries((products || []).map((p: any) => [String(p.id), p]));

      const mpItems = orderItems.map((item: any) => {
        const product = productMap[String(item.id)];
        if (!product) throw new Error(`Producto ${item.id} no encontrado en BD`);

        // Validar stock disponible por talla
        const sizeStock = product.sizes?.[item.selectedSize] ?? product.stock ?? 0;
        if (Number(item.quantity) > Number(sizeStock)) {
          throw new Error(`Stock insuficiente para ${product.name} talla ${item.selectedSize}`);
        }

        return {
          id: String(item.id),
          title: product.name as string,
          quantity: Number(item.quantity),
          unit_price: Number(product.price),
          currency_id: 'CLP'
        };
      });

      // Recalcular envío server-side — nunca confiar en el shipping_cost del cliente.
      // Replica la regla del checkout: gratis sobre el umbral, si no, tarifa por zona.
      const subtotalReal = mpItems.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);

      const { data: shippingSettings } = await supabaseAdmin
        .from('shipping_settings')
        .select('rm, region, free_shipping_threshold')
        .limit(1)
        .single();

      const threshold = shippingSettings?.free_shipping_threshold;
      let shippingCost = 0;
      if (!(threshold && subtotalReal >= Number(threshold))) {
        const region = (order.shipping_address as any)?.region;
        const isRM = region === 'Región Metropolitana de Santiago';
        shippingCost = isRM
          ? Number((shippingSettings?.rm as any)?.price ?? 3990)
          : Number((shippingSettings?.region as any)?.price ?? 6990);
      }

      // Persistir los valores reales en la orden (integridad de registros/reportes)
      await supabaseAdmin
        .from('orders')
        .update({ subtotal: subtotalReal, shipping_cost: shippingCost, total: subtotalReal + shippingCost })
        .eq('id', orderId);

      if (shippingCost > 0) {
        mpItems.push({
          id: 'shipping',
          title: 'Envío',
          quantity: 1,
          unit_price: shippingCost,
          currency_id: 'CLP'
        });
      }

      const preference = new Preference(mpClient);
      const result = await preference.create({
        body: {
          items: mpItems,
          payer: { email: order.customer_email || customerEmail },
          external_reference: orderId,
          back_urls: {
            success: `${appUrl}/success`,
            failure: `${appUrl}/checkout`,
            pending: `${appUrl}/success`
          },
          ...(appUrl.startsWith('https') && { auto_return: 'approved' }),
          notification_url: appUrl.startsWith('https') ? `${appUrl}/api/webhooks/mp` : undefined,
          statement_descriptor: 'CEROCUARENTA'
        }
      });

      res.json({ url: result.init_point });
    } catch (error: any) {
      console.error("MP Preference Error:", JSON.stringify({
        message: error.message,
        status: error.status,
        cause: error.cause,
        body: error?.error?.message || error?.response?.data,
      }, null, 2));
      res.status(500).json({ error: error.message });
    }
  });

  // MercadoPago IPN Webhook
  app.post("/api/webhooks/mp", async (req, res) => {
    // Validar firma antes de procesar
    if (!validateMPSignature(req)) {
      console.warn("MP Webhook: firma inválida rechazada");
      return res.sendStatus(401);
    }

    const { type, data } = req.body;

    if (type === 'payment' && data?.id) {
      try {
        const paymentApi = new Payment(mpClient);
        const paymentData = await paymentApi.get({ id: data.id });

        if (paymentData.status === 'approved') {
          const orderId = paymentData.external_reference;
          if (!orderId) {
            console.warn("MP Webhook: external_reference vacío");
            return res.sendStatus(200);
          }

          const result = await markOrderPaid(orderId, String(data.id), paymentData);
          if (result.justPaid && process.env.NODE_ENV !== 'production') {
            console.log(`Order ${orderId} paid via webhook.`);
          }
        }
      } catch (error) {
        console.error("MP Webhook Error:", error);
      }
    }

    res.sendStatus(200);
  });

  // Verify payment (for Success page — MP sends payment_id as query param)
  app.get("/api/checkout/verify-payment", async (req, res) => {
    const { payment_id } = req.query;
    if (!payment_id) return res.status(400).json({ error: "payment_id required" });

    try {
      const paymentApi = new Payment(mpClient);
      const paymentData = await paymentApi.get({ id: String(payment_id) });

      if (paymentData.status === 'approved') {
        const orderId = paymentData.external_reference;
        if (!orderId) return res.status(400).json({ error: "external_reference missing" });

        // markOrderPaid es idempotente: descuenta stock y encola email
        // solo si esta ruta gana la carrera; si el webhook ya procesó, no duplica.
        await markOrderPaid(orderId, String(payment_id), paymentData);
        return res.json({ status: "paid", orderId });
      }

      res.json({ status: paymentData.status });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
