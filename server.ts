import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

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

async function startServer() {
  const app = express();
  const PORT = 3000;
  const allowedOrigins = [
    "http://localhost:3000",
    "https://cerocuarenta.cl",
    "https://www.cerocuarenta.cl",
  ];

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });

  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Create MercadoPago preference and return checkout URL
  app.post("/api/checkout/mp", async (req, res) => {
    try {
      const { orderId, items, customerEmail, total } = req.body;
      const appUrl = process.env.APP_URL || 'http://localhost:3000';

      if (!process.env.MP_ACCESS_TOKEN) {
        return res.status(500).json({ error: "MercadoPago no configurado" });
      }

      const preference = new Preference(mpClient);
      const result = await preference.create({
        body: {
          items: items.map((item: any) => ({
            id: String(item.id),
            title: item.name,
            quantity: item.quantity,
            unit_price: item.price,
            currency_id: 'CLP'
          })),
          payer: { email: customerEmail },
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
      console.error("MP Preference Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // MercadoPago IPN Webhook
  app.post("/api/webhooks/mp", async (req, res) => {
    const { type, data } = req.body;

    if (type === 'payment' && data?.id) {
      try {
        const paymentApi = new Payment(mpClient);
        const paymentData = await paymentApi.get({ id: data.id });

        if (paymentData.status === 'approved') {
          const orderId = paymentData.external_reference;

          const { data: order } = await supabaseAdmin
            .from("orders")
            .select("*")
            .eq("id", orderId)
            .single();

          if (order && order.status !== "paid") {
            const items = order.items || [];

            await supabaseAdmin
              .from("orders")
              .update({
                status: "paid",
                payment_id: String(data.id),
                paid_at: new Date().toISOString(),
                payment_data: paymentData
              })
              .eq("id", orderId);

            for (const item of items) {
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
                  .update({
                    sizes: { ...currentSizes, [item.selectedSize]: newSizeStock },
                    stock: newTotalStock
                  })
                  .eq("id", item.id);
              }
            }

            await supabaseAdmin.from("emails").insert({
              to: order.customer_email,
              subject: `Confirmación de Pedido #${orderId} - CeroCuarenta`,
              template: "order_confirmation",
              order_id: orderId,
              sent_at: new Date().toISOString(),
              status: "sent"
            });

            console.log(`Order ${orderId} paid via MercadoPago.`);
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
        await supabaseAdmin
          .from("orders")
          .update({
            status: "paid",
            payment_id: String(payment_id),
            paid_at: new Date().toISOString()
          })
          .eq("id", orderId);
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
