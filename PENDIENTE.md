# Pendientes para dejar cerocuarenta.cl en producción

> Estado: el código está completo y verificado (build + smoke-test OK).
> Solo faltan 3 pasos manuales en paneles externos. — 2026-06-16

## 🔴 1. MP_WEBHOOK_SECRET (bloquea el arranque en producción)
Con `NODE_ENV=production` el server **no arranca** si esta variable está vacía.
1. MercadoPago → **Tus integraciones → tu app → Webhooks**.
2. Crear webhook con URL: `https://cerocuarenta.cl/api/webhooks/mp`.
3. Copiar la **firma secreta** que genera MP.
4. Pegarla en `.env` → `MP_WEBHOOK_SECRET=...`

## 🟡 2. RESEND_API_KEY (emails de confirmación)
Sin esto los emails se registran como `skipped` (no se envían, pero no rompen el pago).
1. Crear cuenta en https://resend.com.
2. Verificar el dominio `cerocuarenta.cl` (registros DNS).
3. Crear API key y pegarla en `.env` → `RESEND_API_KEY=...`
4. Confirmar `RESEND_FROM` (por defecto: `CeroCuarenta <pedidos@cerocuarenta.cl>`).

## ⚠️ 3. Renovar credenciales MP (se filtraron en el chat)
Una vez confirmado que todo funciona, renovar en MercadoPago:
- **Access Token** y **Client Secret** (el Public Key y Client ID son públicos, no hace falta).

---

## Cómo levantar en producción
```bash
npm install
npm run build      # genera dist/
npm run start      # NODE_ENV=production tsx server.ts
```
Para desarrollo local: `npm run dev` (NODE_ENV no seteado → usa Vite).

## Hecho en la sesión del 2026-06-16
- Fix idempotencia de pago (stock + email exactamente una vez).
- Envío recalculado server-side (anti-manipulación del shipping_cost).
- Emails con Resend (estado real sent/failed/skipped).
- SEO: robots.txt, sitemap.xml, og-image.jpg, canonical, JSON-LD.
- Hardening: MIME en upload admin, Authorization en CORS.
- Credenciales MP de producción cargadas en `.env`.
