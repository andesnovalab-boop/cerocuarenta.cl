# cerocuarenta — Backend en vivo, paso a paso (sin terminal)

Todo se hace en el navegador. Tu proyecto Supabase es **bnselsqkorrycugymcij**.

---

## PASO 0 — Tener a mano los valores secretos
1. En tu computador, abre la carpeta del proyecto `cerocuarenta.cl`.
2. Abre el archivo **`.env`** con un editor de texto (Bloc de notas / TextEdit).
3. Vas a necesitar copiar de ahí estos valores (los usarás en el Paso 3):
   - `MP_ACCESS_TOKEN`
   - `MP_WEBHOOK_SECRET`
   - `RESEND_API_KEY`
   - `RESEND_FROM`
   Déjalo abierto.

---

## PASO 1 — Aplicar las políticas de seguridad (RLS)
1. Entra a **https://supabase.com** → inicia sesión → entra a tu proyecto **cerocuarenta**.
2. En el menú de la izquierda, clic en **SQL Editor** (ícono `</>`).
3. Clic en **+ New query** (arriba).
4. Abre el archivo `supabase/rls.sql` del proyecto, **copia TODO** y pégalo en el recuadro.
5. Clic en **Run** (botón verde abajo a la derecha, o Ctrl+Enter).
6. Debe decir **"Success. No rows returned"**. Si sale un error en rojo, cópiamelo y lo vemos.

---

## PASO 2 — Crear las 3 funciones (Edge Functions)
Vas a crear **3 funciones**. Para cada una repites lo mismo:

1. Menú izquierdo → **Edge Functions**.
2. Clic en **Deploy a new function** (o **Create a function** / **Via editor**).
3. En **Name** (nombre), escribe EXACTAMENTE el nombre (sin mayúsculas ni espacios).
4. Borra el código de ejemplo que aparece, abre el archivo correspondiente del proyecto, **copia TODO** y pégalo.
5. Clic en **Deploy**.

| Función | Nombre exacto | Archivo a copiar |
|---|---|---|
| 1 | `checkout-mp` | `supabase/functions/_bundled/checkout-mp.ts` |
| 2 | `verify-payment` | `supabase/functions/_bundled/verify-payment.ts` |
| 3 | `mp-webhook` | `supabase/functions/_bundled/mp-webhook.ts` |

⚠️ **MUY IMPORTANTE para `mp-webhook`:** antes (o después) de desplegarla, busca la opción **"Verify JWT"** (Verificar JWT) en los ajustes de esa función y **DESACTÍVALA** (queda en OFF). Mercado Pago no envía token, y si queda activa el webhook fallará. Las otras dos pueden quedar como están.

---

## PASO 3 — Cargar los secretos
1. Menú izquierdo → **Edge Functions** → pestaña **Secrets** (o **Manage secrets**).
   (También está en **Project Settings → Edge Functions → Secrets**.)
2. Agrega estos secretos uno por uno (botón **Add new secret**), copiando el valor desde tu `.env`:

| Nombre (Key) | Valor (de dónde sale) |
|---|---|
| `MP_ACCESS_TOKEN` | del `.env` |
| `MP_WEBHOOK_SECRET` | del `.env` |
| `APP_URL` | escribe: `https://cerocuarenta.cl` |
| `RESEND_API_KEY` | del `.env` |
| `RESEND_FROM` | del `.env` (ej: `CeroCuarenta <pedidos@cerocuarenta.cl>`) |
| `RESEND_REPLY_TO` | escribe: `contacto@cerocuarenta.cl` |

3. Guarda. (NO necesitas agregar `SUPABASE_URL` ni `SUPABASE_SERVICE_ROLE_KEY`: Supabase los pone solo.)

> Si cambiaste secretos, vuelve a **Deploy** las 3 funciones para que tomen los valores nuevos (o espera unos segundos; Supabase suele recargarlos).

---

## PASO 4 — Conectar el webhook en Mercado Pago
1. Entra a **https://www.mercadopago.cl/developers/panel** → inicia sesión.
2. **Tus integraciones** → abre tu aplicación (Client ID **4145569972920417**).
3. Menú → **Webhooks** (o "Notificaciones") → modo **Producción**.
4. En **URL de producción**, pega EXACTAMENTE:
   ```
   https://bnselsqkorrycugymcij.supabase.co/functions/v1/mp-webhook
   ```
5. En **Eventos**, marca **Pagos** (`payment`).
6. **Guardar**.
   - Si Mercado Pago te muestra una **clave secreta** nueva, cópiala y reemplaza el secreto `MP_WEBHOOK_SECRET` en Supabase (Paso 3) y vuelve a Deploy `mp-webhook`.

---

## PASO 5 — Probar (la prueba de fuego)
1. Abre tu sitio en Hostinger (`https://cerocuarenta.cl`).
2. Agrega un producto al carrito → ve al checkout → completa tus datos → paga con Mercado Pago (monto bajo, real).
3. Verifica que TODO ocurra:
   - ✅ Te redirige a Mercado Pago y vuelves a `/success` con "pago exitoso".
   - ✅ En Supabase → **Table Editor** → tabla `orders`: la orden quedó en **paid**.
   - ✅ En la tabla `products`: bajó el **stock** del producto comprado.
   - ✅ Llegó el **email** de confirmación.
4. Prueba también el **admin** (`/admin`): crear producto, subir una foto, marcar un pedido como enviado, guardar configuración de envío.

Si algo falla: en Supabase → **Edge Functions** → clic en la función → pestaña **Logs**, copia el error y me lo pasas.

---

## Después (cuando todo pase)
- Recién ahí apagamos Render y limpiamos el `server.ts` del proyecto.
