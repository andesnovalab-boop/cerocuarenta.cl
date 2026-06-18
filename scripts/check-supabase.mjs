// Verifica que Supabase esté activo y la data clave esté en orden.
// Uso: node scripts/check-supabase.mjs
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supa = createClient(url, key, { auth: { persistSession: false } });

async function count(table) {
  const { count, error } = await supa.from(table).select("*", { count: "exact", head: true });
  if (error) { console.log(`  ❌ ${table}: ${error.message}`); return; }
  console.log(`  ✅ ${table}: ${count} filas`);
}

console.log("== Conteo de tablas ==");
for (const t of ["products", "orders", "shipping_settings", "blog_posts", "users", "emails"]) await count(t);

console.log("\n== Admins ==");
const { data: admins } = await supa.from("users").select("email, role").eq("role", "admin");
console.log(" ", admins?.map(a => a.email).join(", ") || "(ninguno)");

console.log("\n== Configuración de envío ==");
const { data: ss } = await supa.from("shipping_settings").select("*").limit(1).single();
console.log(" ", ss ? JSON.stringify(ss) : "(sin configurar)");

console.log("\n== Productos publicados (muestra) ==");
const { data: prods } = await supa.from("products").select("name, price, stock").limit(5);
prods?.forEach(p => console.log(`  · ${p.name} — $${p.price} (stock: ${p.stock})`));
