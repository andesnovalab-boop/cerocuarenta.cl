# cerocuarenta.cl — Mapa de Integraciones (Backend)

> Última actualización: 2026-06-21. Proyecto Supabase: **bnselsqkorrycugymcij**.
> Stack actual: **Frontend estático (React/Vite en Hostinger) + Supabase (DB, Auth, Storage, Edge Functions)**.
> El backend antiguo `server.ts` (Express/Render) está **en retiro** — su lógica ya fue portada a Edge Functions.

---

## 1. Servicios externos conectados

| Servicio | Para qué se usa | Credenciales (en Secrets de Supabase) |
|---|---|---|
| **Supabase** | Base de datos, autenticación (Google), almacenamiento de imágenes, y las Edge Functions | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (inyectadas solas) · `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (frontend) |
| **Mercado Pago** (Checkout Pro, producción) | Cobro de pedidos. Client ID `4145569972920417` | `MP_ACCESS_TOKEN` (APP_USR-…), `MP_WEBHOOK_SECRET`, `VITE_MP_PUBLIC_KEY` |
| **Resend** | Envío del correo de confirmación de compra. Dominio `cerocuarenta.cl` verificado | `RESEND_API_KEY`, `RESEND_FROM` (`CeroCuarenta <pedidos@cerocuarenta.cl>`), `RESEND_REPLY_TO` |
| **Google OAuth** (vía Supabase Auth) | Login de clientes y admin | configurado en Supabase Auth |

---

## 2. Edge Functions (backend en la nube) — las 3 funciones

Todas viven en `supabase/functions/`. El código "fuente" está en cada carpeta; las versiones para pegar en el panel están en `_bundled/`.

### `checkout-mp`  → crea el pedido y la preferencia de pago
- **Quién la llama:** el frontend, al apretar "Pagar" (`src/pages/Checkout.tsx:260`).
- **Qué hace, paso a paso:**
  1. Recibe el carrito, dirección, método de envío y email.
  2. Crea la orden en la tabla `orders` con estado `pending` (usando service-role, para que funcione también en compras de invitado).
  3. **Recalcula TODO desde la base de datos** (precios, stock por talla, costo de envío) — nunca confía en lo que manda el navegador. Es la defensa anti-manipulación de precios.
  4. Valida que haya stock suficiente.
  5. Llama a Mercado Pago para crear una **preferencia** y devuelve el `init_point` (la URL de pago).
- **Devuelve:** `{ url }` → el frontend redirige al cliente a Mercado Pago.
- **Notas:** define `notification_url` apuntando a `mp-webhook`, y `auto_return: approved` (solo en https).

### `verify-payment`  → confirma el pago cuando el cliente vuelve al sitio
- **Quién la llama:** la página `/success` (`src/pages/Success.tsx:31`), con el `payment_id` que Mercado Pago pone en la URL al volver.
- **Qué hace:**
  1. Consulta el pago real en Mercado Pago (`getPayment`).
  2. Si está `approved`, llama a `markOrderPaid` con el `external_reference` (= id de la orden).
- **Por qué existe:** es el camino principal de confirmación. Es **idempotente** (si el webhook ya procesó, no duplica).

### `mp-webhook`  → confirma el pago de forma automática (respaldo)
- **Quién la llama:** Mercado Pago directamente (servidor a servidor), aunque el cliente cierre la pestaña.
- **Qué hace:**
  1. **Valida la firma** (`x-signature`) con `MP_WEBHOOK_SECRET` — si no coincide, rechaza con 401.
  2. Si el evento es `payment` y está `approved`, llama a `markOrderPaid`.
- **IMPORTANTE de despliegue:** debe estar desplegada con **Verify JWT = OFF** (MP no manda token). Debe estar registrada en el panel de MP con la URL:
  `https://bnselsqkorrycugymcij.supabase.co/functions/v1/mp-webhook`

---

## 3. Módulos compartidos (`supabase/functions/_shared/`)

| Archivo | Función | Qué hace |
|---|---|---|
| `mp.ts` | `createPreference` / `getPayment` / `validateSignature` | Habla con la API de Mercado Pago vía fetch (sin SDK) y valida la firma HMAC del webhook. |
| `orders.ts` | `markOrderPaid` | **El corazón del flujo.** Transición atómica `pending → paid` (guard `eq("status","pending")` para no duplicar), descuenta stock por talla, dispara el correo y registra el envío en la tabla `emails`. |
| `email.ts` | `sendOrderEmail` | Arma el HTML del correo de confirmación y lo envía por Resend. Devuelve `sent` / `failed` / `skipped`. |
| `supa.ts` | `supabaseAdmin` | Cliente Supabase con service-role (salta RLS para operaciones de servidor). |
| `cors.ts` | `cors` / `json` | Cabeceras CORS y helper de respuesta JSON. |

**Flujo completo de una compra:**
```
Checkout.tsx → checkout-mp (crea orden pending + preferencia) → cliente paga en Mercado Pago
   ├─ vuelve a /success → verify-payment ─┐
   └─ (en paralelo) MP llama a mp-webhook ┤→ markOrderPaid (idempotente)
                                          └→ marca paid + descuenta stock + envía correo (Resend)
```

---

## 4. Base de datos (tablas)

| Tabla | Uso | Filas (2026-06-21) |
|---|---|---|
| `products` | Catálogo (precio, stock total y por talla, activo) | 4 |
| `orders` | Pedidos (estado: pending/paid/shipped) | — |
| `users` | Clientes y roles (admin) | 3 |
| `newsletter_subscribers` | Suscriptores | 0 |
| `shipping_settings` | Costos de envío RM/regiones y umbral de envío gratis | 1 |
| `emails` | Log de correos enviados | — |
| `blog_posts` | Blog (publicado/borrador) | 0 |

**Seguridad (RLS):** ✅ Activa y verificada. Un usuario anónimo NO puede leer `orders` ni `users`; SÍ puede leer `products`. Definida en `supabase/rls.sql`.

**Storage:** bucket público `product-images` (fotos de productos y logo de marca).

---

## 5. Frontend → backend (puntos de contacto)

- `Checkout.tsx` → invoca `checkout-mp`.
- `Success.tsx` → invoca `verify-payment`.
- `Home.tsx` / `ProductDetail.tsx` → leen `products` directo (RLS permite lectura pública).
- `AdminDashboard.tsx` → CRUD directo a `products`, `orders`, `blog_posts`, `shipping_settings`, `users` + subida a Storage (protegido por RLS de admin).
- `Login.tsx` / `AuthContext.tsx` → Google Auth + upsert en `users`.

---

## 6. Estado y pendientes (revisión 2026-06-21)

### ✅ Resuelto
- Las 3 Edge Functions están **desplegadas y respondiendo**.
- `MP_ACCESS_TOKEN` es de **producción** y funciona (crea órdenes y consulta pagos).
- **RLS aplicada y verificada** en `orders`/`users`/`products`.
- **BUG CRÍTICO corregido:** a la tabla `orders` le faltaban las columnas `paid_at` y `payment_data`; sin ellas `markOrderPaid` fallaba en silencio y dejaba todo en `pending` ("carrito abandonado"). Ya agregadas.
- Dominio `cerocuarenta.cl` **verificado en Resend** y la llave envía correctamente.
- 2 ventas reales que quedaron atascadas fueron **recuperadas** (marcadas `paid`) y sus correos reenviados.

### ⚠️ Por verificar / pendiente
1. **Correo automático desde la nube:** los correos de recuperación se enviaron manualmente. Falta **una compra de prueba real** que confirme que la función `verify-payment` en la nube envía el correo sola (depende de que `RESEND_FROM` y `RESEND_API_KEY` estén bien cargados en Secrets de Supabase — confirmado por el usuario).
2. **Webhook de Mercado Pago:** confirmar que está **registrado en el panel de MP** (URL arriba), con evento `payment`, que `MP_WEBHOOK_SECRET` coincide con el del panel, y que `mp-webhook` está desplegada con **Verify JWT = OFF**. Sin esto, solo funciona la confirmación vía `/success` (frágil si el cliente cierra la pestaña).
3. **Retirar el backend antiguo** (`server.ts` / Render) para evitar confusión y doble fuente de verdad.
4. **Boleta electrónica (SII):** la página `/success` promete "descargar boleta electrónica" pero **no existe integración** que la genere. Decidir si se implementa o se quita el texto.
5. **Posible deriva de esquema en otras tablas:** la tabla `orders` tenía columnas faltantes vs la migración. Conviene revisar que `products`, `shipping_settings`, etc. coincidan con `migrations/001_ecommerce_schema.sql`.
6. **Newsletter:** la tabla existe pero está vacía — verificar si el formulario de suscripción está conectado.
