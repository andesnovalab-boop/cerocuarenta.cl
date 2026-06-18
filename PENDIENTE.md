# CeroCuarenta — Estado

> ✅ **Completamente desarrollada y configurada.** `.env` 10/10. Lista para producción. — 2026-06-17

## Para desplegar
```bash
npm install
npm run build      # genera dist/
npm run start      # NODE_ENV=production tsx server.ts
```
Desarrollo local: `npm run dev`.

## ⚠️ Única pendiente: rotar secretos que pasaron por el chat
Cuando confirmes que todo funciona en producción, regenera y reemplaza en `.env`:
- **MercadoPago** → Access Token y Client Secret (Tus integraciones → Credenciales de producción → Renovar).
- **Resend** → API key (resend.com → API Keys → recrear).
- (El Public Key y Client ID son públicos; no requieren rotación.)

## Hecho (sesión 16–17 jun 2026)
- Pago idempotente (stock + email exactamente una vez).
- Envío recalculado server-side (anti-manipulación).
- Emails de confirmación con Resend (estado real sent/failed/skipped).
- SEO: robots.txt, sitemap.xml, og-image.jpg, canonical, JSON-LD.
- Hardening: MIME en upload admin, Authorization en CORS.
- Credenciales MP producción + webhook secret + Resend key en `.env` (10/10).
