# Migración cerocuarenta → Hostinger estático (sin servidor Node)

Objetivo: eliminar el servidor Express (`server.ts` en Render) y servir el sitio como **estático en Hostinger**, moviendo el backend a **Supabase** (RLS) + **Edge Functions (Deno)** para los pagos.

## Arquitectura nueva
- **Frontend** React/Vite → `npm run build` → `dist/` → Hostinger `public_html` (+ `.htaccess` para rutas SPA).
- **Admin + crear orden** → Supabase directo desde el navegador, controlado por `rls.sql`.
- **Pagos (secretos)** → 3 Edge Functions: `checkout-mp`, `mp-webhook`, `verify-payment`.

## Estado de esta carpeta
✅ Hecho (sin tocar el sitio en producción):
- `supabase/functions/_shared/` — lógica común portada de `server.ts` (MP, Resend, markOrderPaid, firma webhook).
- `supabase/functions/checkout-mp | mp-webhook | verify-payment` — Edge Functions.
- `supabase/rls.sql` — políticas para admin directo + crear orden + storage.

✅ Hecho también (Etapa 3 — recableo del frontend, `tsc` + `vite build` OK):
| Llamada actual (`/api/...`) | Reemplazo |
|---|---|
| `POST /api/checkout/create-order` + `POST /api/checkout/mp` | **Fusionados** en `supabase.functions.invoke('checkout-mp', { body:{items, shippingAddress, shippingMethod, customerEmail, userId} })`. La función crea la orden (service-role) y devuelve la URL de pago. |
| `GET /api/checkout/verify-payment` (Success.tsx:30) | `supabase.functions.invoke('verify-payment')` con `?payment_id=` |
| `POST /api/admin/products` (AdminDashboard) | `supabase.from('products').insert(...)` |
| `POST /api/admin/blog` + delete/publish | `supabase.from('blog_posts')...` |
| `POST /api/admin/shipping` | `supabase.from('shipping_settings').upsert(...)` |
| `PATCH /api/admin/orders/:id/ship` | `supabase.from('orders').update({status:'shipped'})...` |
| `DELETE /api/admin/orders/clear` | `supabase.from('orders').delete().in('status',['paid','shipped'])` |
| `POST /api/admin/upload` | `supabase.storage.from('product-images').upload(...)` directo |

🔲 También: `public/.htaccess` (rewrite a index.html), quitar `server.ts`/express del `package.json`, cambiar `build`/`start`.

## Deploy de las Edge Functions (gráfico o CLI)
**CLI:**
```bash
supabase link --project-ref TU-REF
supabase functions deploy checkout-mp
supabase functions deploy verify-payment
supabase functions deploy mp-webhook --no-verify-jwt   # MP no manda JWT
supabase secrets set MP_ACCESS_TOKEN=... MP_WEBHOOK_SECRET=... APP_URL=https://cerocuarenta.cl \
  RESEND_API_KEY=... RESEND_FROM="CeroCuarenta <...>" RESEND_REPLY_TO=contacto@cerocuarenta.cl
```
(SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY los inyecta Supabase solo.)
**Gráfico:** Dashboard → Edge Functions → Create → pega el código → Deploy; Secrets en la misma pantalla.

Webhook en MercadoPago → `https://TU-REF.supabase.co/functions/v1/mp-webhook` (evento: payment).

## Diferencias vs Express (a tener en cuenta)
- **Rate-limiter:** Express lo hacía en memoria (5 intentos/IP/10min). Las functions son stateless; si se quiere, se resuelve con una tabla `rate_limits`. Por ahora se omite (MercadoPago ya protege el pago real).
- Todo lo demás (validación de firma, recálculo de precios/envío, descuento de stock idempotente, email) es **idéntico**.

## Probar ANTES de apagar Render
1. Aplica `rls.sql`, despliega functions + secrets.
2. Recablea el frontend (Etapa 3), `npm run build`, sube `dist/` a un subdominio/carpeta de prueba.
3. Compra de prueba real → verifica: orden creada, pago aprobado, webhook marca `paid`, stock baja, email llega.
4. Solo cuando todo pase: apaga Render y apunta el dominio a Hostinger.
