# Guía: verificar el dominio de Resend en Hostinger

> Objetivo: que los emails de confirmación salgan desde `pedidos@cerocuarenta.cl`
> y lleguen a **cualquier cliente** (hoy solo llegan a tu propio correo).
> Tiempo: ~15 min + espera de propagación (de minutos a unas horas).

---

## PASO 1 — Obtener los records en Resend
1. Entra a **https://resend.com** → menú **"Domains"**.
2. Botón **"Add Domain"** → escribe `cerocuarenta.cl` → **Add**.
3. Resend te mostrará una **lista de registros DNS** (MX y varios TXT).
   Deja esa pestaña abierta: vas a copiar esos valores.

Los registros que muestra Resend son de 3 tipos (los valores exactos son únicos de tu dominio):

| Tipo | Para qué sirve | Ejemplo de "Host/Name" que muestra Resend |
|------|----------------|-------------------------------------------|
| **MX** | Recibir rebotes/respuestas | `send.cerocuarenta.cl` |
| **TXT (SPF)** | Autoriza a Resend a enviar | `send.cerocuarenta.cl` |
| **TXT (DKIM)** | Firma los correos (anti-spam) | `resend._domainkey.cerocuarenta.cl` |
| **TXT (DMARC)** *(opcional)* | Política de correo | `_dmarc.cerocuarenta.cl` |

---

## PASO 2 — Abrir la zona DNS en Hostinger
1. Entra a **https://hpanel.hostinger.com** con tu cuenta.
2. Menú **"Dominios"** → elige **cerocuarenta.cl**.
3. Entra a **"DNS / Nameservers"** → pestaña **"Registros DNS"** (DNS Zone).

   > Si el dominio usa los nameservers de Hostinger, verás la lista de registros aquí.
   > Si usa otros nameservers (ej. Cloudflare), los DNS se editan ALLÁ, no en Hostinger.

---

## ⚠️ EL TRUCO MÁS IMPORTANTE (no te equivoques aquí)
Resend muestra el host **completo** (`send.cerocuarenta.cl`), pero Hostinger en el
campo **"Nombre"** quiere **solo la parte de adelante**, SIN el dominio:

| Resend muestra | En Hostinger, campo "Nombre" pones |
|----------------|-------------------------------------|
| `send.cerocuarenta.cl` | `send` |
| `resend._domainkey.cerocuarenta.cl` | `resend._domainkey` |
| `_dmarc.cerocuarenta.cl` | `_dmarc` |
| `cerocuarenta.cl` (raíz) | `@` |

> Regla: copia el host de Resend y **bórrale** `.cerocuarenta.cl` del final.

---

## PASO 3 — Agregar cada registro en Hostinger
En Hostinger: botón **"Agregar registro"**. Repite para cada uno:

### 1) Registro MX
- **Tipo:** MX
- **Nombre:** `send`
- **Apunta a / Servidor de correo:** *(el valor que da Resend, ej. `feedback-smtp.us-east-1.amazonses.com`)*
- **Prioridad:** `10`
- **TTL:** dejar el de por defecto (3600 o Auto)

### 2) Registro TXT — SPF
- **Tipo:** TXT
- **Nombre:** `send`
- **Valor / Contenido:** *(el que da Resend, normalmente `v=spf1 include:amazonses.com ~all`)*
- **TTL:** por defecto

### 3) Registro TXT — DKIM
- **Tipo:** TXT
- **Nombre:** `resend._domainkey`
- **Valor / Contenido:** *(la clave larga que da Resend — cópiala COMPLETA, empieza con `p=...`)*
- **TTL:** por defecto

> La clave DKIM es larga. Cópiala entera, sin espacios ni saltos de línea extra.

### 4) Registro TXT — DMARC *(opcional pero recomendado)*
- **Tipo:** TXT
- **Nombre:** `_dmarc`
- **Valor:** `v=DMARC1; p=none;`
- **TTL:** por defecto

Guarda cada registro.

---

## PASO 4 — Verificar en Resend
1. Vuelve a la pestaña de Resend (Domains).
2. Botón **"Verify"** (o se verifica solo cada cierto rato).
3. Cuando todos los registros aparezcan en **verde / "Verified"**, listo. ✅
   - Puede tardar de **minutos a unas horas** (propagación DNS).

---

## PASO 5 — Confirmar que funciona
En el proyecto:
```bash
node scripts/test-email.mjs algun-correo@gmail.com
```
- Si el dominio quedó verificado, el correo saldrá desde `pedidos@cerocuarenta.cl`
  (ya no usará el fallback `onboarding@resend.dev`) y llegará a cualquier destinatario.

El `.env` ya está configurado:
```
RESEND_FROM=CeroCuarenta <pedidos@cerocuarenta.cl>
```
No hay que tocar el código.

---

## Errores comunes
- **Puse el host completo** (`send.cerocuarenta.cl`) en "Nombre" → Hostinger lo
  interpreta como `send.cerocuarenta.cl.cerocuarenta.cl`. Pon solo `send`.
- **Tengo ya un SPF** (`v=spf1...`) para otro servicio → NO crees dos. Se combinan
  en uno solo: `v=spf1 include:amazonses.com include:_otro_ ~all`.
- **No verifica nunca** → revisa que no haya espacios al inicio/fin del valor TXT,
  y espera más tiempo (propagación). Usa https://mxtoolbox.com para chequear.
- **Dominio en Cloudflare/otro DNS** → edítalo ahí, no en Hostinger; si un registro
  DKIM tiene la nube naranja de Cloudflare, ponlo en "DNS only" (gris).
