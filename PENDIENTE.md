# CeroCuarenta — Pendientes

> Estado: ✅ Desplegado en Render y funcionando (frontend + API + SPA + emails + pagos).
> URL actual: https://cerocuarenta.onrender.com — Última actualización: 2026-06-18

## ✅ Ya hecho
- Deploy en Render (Blueprint). `/club`, `/admin`, `/api/health` responden 200.
- Pagos MercadoPago (producción), webhook validado, emails con Resend (dominio verificado).
- SEO, footer con datos reales, logo en emails (Supabase storage).
- Supabase activo.

## 🔴 Pendientes ANTES de vender en serio
1. **Precios reales** — los 4 productos están a **$1** (test). Corregir en `/admin`.
2. **Envío real** — hoy RM/Regiones en **$0**, umbral envío gratis en **$1**. Corregir en `/admin`.
3. **APP_URL en Render** — debe ser `https://cerocuarenta.onrender.com` (o el dominio final).
4. **Webhook MercadoPago** — apuntar a `…/api/webhooks/mp` de la URL real (onrender o dominio).

## 🟡 Para dejarlo redondo
5. **Dominio propio** — conectar `cerocuarenta.cl` a Render (Custom Domain + DNS en Hostinger).
   Luego cambiar `APP_URL` y el webhook a `https://cerocuarenta.cl`.
6. **Keep-alive (UptimeRobot)** — monitor a `/api/health` cada 5 min (evita cold starts del free tier).
   También está el workflow `.github/workflows/keep-alive.yml` (configurar secrets en GitHub).
7. **"Responder a" del email** — definir a qué correo real llegan las respuestas de clientes
   (andesnovalab@gmail.com / juanplazabravo@gmail.com / contacto@cerocuarenta.cl) → se agrega `reply_to` en sendOrderEmail.
8. **Plan Render** — al confirmar ventas, subir Free → Starter (~US$7/mes) para always-on.

## ⚠️ Seguridad
9. **Rotar secretos** que pasaron por el chat: Access Token y Client Secret (MercadoPago),
   API key (Resend), service-role key (Supabase). Regenerar y actualizar en `.env` y Render.

## Guías de referencia
- `GUIA-DEPLOY-RENDER.md` — deploy y dominio.
- `GUIA-DNS-RESEND-HOSTINGER.md` — verificación de dominio en Resend (ya hecho).
