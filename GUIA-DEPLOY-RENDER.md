# Guía: desplegar CeroCuarenta en Render

> El server (`server.ts`) sirve TODO: frontend + API + fallback SPA.
> Al quedar en Render, ya no necesitas el `.htaccess` ni el hosting estático de Hostinger.

---

## PASO 1 — Código en GitHub
Ya está en `github.com/andesnovalab-boop/cerocuarenta.cl` (rama `main`).
El `render.yaml` y los ajustes ya están commiteados y pusheados.

## PASO 2 — Crear el servicio en Render
1. Entra a **https://render.com** → crea cuenta (puedes usar "Sign in with GitHub").
2. **New +** → **Blueprint**.
3. Conecta el repo `cerocuarenta.cl`. Render detecta el `render.yaml` automáticamente.
4. Te pedirá completar los **valores de las variables** (están como `sync:false`).

## PASO 3 — Cargar las variables de entorno
Copia los valores desde tu archivo `.env` local. Render te pedirá:

| Variable | De dónde sale |
|----------|---------------|
| VITE_SUPABASE_URL | .env |
| VITE_SUPABASE_ANON_KEY | .env |
| SUPABASE_URL | .env |
| SUPABASE_SERVICE_ROLE_KEY | .env |
| MP_ACCESS_TOKEN | .env |
| VITE_MP_PUBLIC_KEY | .env |
| MP_WEBHOOK_SECRET | .env |
| MP_CLIENT_ID | .env |
| MP_CLIENT_SECRET | .env |
| RESEND_API_KEY | .env |
| RESEND_FROM | .env |
| VITE_ADMIN_EMAIL | .env |
| APP_URL | **ver paso 5** |

> `NODE_ENV=production` ya viene fijo en el `render.yaml`.

## PASO 4 — Primer deploy
1. Render hace `npm install --include=dev && npm run build` y luego `npm run start`.
2. Cuando termine, te da una URL tipo **`https://cerocuarenta.onrender.com`**.
3. Pruébala: abre `…onrender.com/club` y `…onrender.com/api/health` → ya NO dan 404.

## PASO 5 — APP_URL y dominio propio
1. **Mientras pruebas:** pon `APP_URL = https://cerocuarenta.onrender.com`.
2. **Para usar tu dominio:** en Render → Settings → **Custom Domains** → agrega `cerocuarenta.cl`.
3. Render te dará un destino (CNAME o A). En **Hostinger → DNS** apunta `cerocuarenta.cl` a ese destino.
   - ⚠️ Esto reemplaza el sitio estático actual de Hostinger (deja de usarse).
4. Cuando el dominio quede activo en Render, cambia `APP_URL = https://cerocuarenta.cl`.

## PASO 6 — Webhook de MercadoPago
En MercadoPago → tu app → Webhooks, confirma la URL:
`https://cerocuarenta.cl/api/webhooks/mp`
(El `MP_WEBHOOK_SECRET` ya coincide con el que pusiste en `.env` / Render.)

## PASO 7 — Keep-alive (que no se duerma)
**Render (free duerme a los 15 min):**
- Crea cuenta en **https://uptimerobot.com** (gratis).
- Nuevo monitor → tipo HTTP(s) → URL `https://cerocuarenta.cl/api/health` → intervalo **5 min**.

**Supabase (free pausa a los 7 días):**
- Opción A: el monitor de UptimeRobot ya ayuda si pega a un endpoint que toca la BD.
- Opción B (incluida): el workflow `.github/workflows/keep-alive.yml` ya hace ping a Render
  y a Supabase cada 10 min. Solo configura en GitHub → Settings → Secrets → Actions:
  - `RENDER_URL = https://cerocuarenta.cl`
  - `SUPABASE_URL = https://bnselsqkorrycugymcij.supabase.co`
  - `SUPABASE_ANON_KEY = <tu anon key>`

## PASO 8 — Cuando vendas en serio
En Render → Settings → cambia el plan **Free → Starter (~US$7/mes)**. Always-on, sin cold starts. No cambia nada del código.

---

## Resumen de qué queda dónde
- **Frontend + API + emails + pagos** → Render (un solo lugar).
- **Base de datos / storage / auth** → Supabase.
- **Dominio** → Hostinger DNS apuntando a Render.
- El `.htaccess` y el hosting estático de Hostinger quedan obsoletos (puedes dejarlos o borrarlos).
