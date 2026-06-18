// Sube el logo a Supabase Storage para usarlo en los emails (URL pública estable).
// Uso: node scripts/upload-logo.mjs
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error("Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }

const supa = createClient(url, key, { auth: { persistSession: false } });
// Logo BLANCO: el encabezado del email es negro, así se ve bien.
const file = readFileSync("public/images/logo_blanco.png");

const { error } = await supa.storage
  .from("product-images")
  .upload("brand/logo-blanco.png", file, { contentType: "image/png", upsert: true });

if (error) { console.error("Error al subir:", error.message); process.exit(1); }

const { data } = supa.storage.from("product-images").getPublicUrl("brand/logo-blanco.png");
console.log(data.publicUrl);
