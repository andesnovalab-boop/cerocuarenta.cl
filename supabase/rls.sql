-- ============================================================
--  cerocuarenta — RLS para arquitectura ESTÁTICA (sin Express)
--  Reemplaza los endpoints /api/admin/* y /api/checkout/create-order:
--  el admin escribe directo a Supabase y el storefront crea órdenes,
--  todo controlado por estas políticas.
--
--  ⚠️ REVISА antes de aplicar. Ejecuta en Supabase → SQL Editor.
--  No borra políticas existentes; agrega las necesarias.
-- ============================================================

-- Helper: ¿el usuario autenticado es admin? (lee public.users.role)
create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select exists (select 1 from public.users where id = auth.uid() and role = 'admin');
$$;

alter table public.products         enable row level security;
alter table public.blog_posts       enable row level security;
alter table public.shipping_settings enable row level security;
alter table public.orders           enable row level security;

-- ---------- PRODUCTS ----------
drop policy if exists "products public read" on public.products;
create policy "products public read" on public.products for select using (true);
drop policy if exists "products admin write" on public.products;
create policy "products admin write" on public.products for all
  using (public.is_admin()) with check (public.is_admin());

-- ---------- BLOG ----------
drop policy if exists "blog public read" on public.blog_posts;
create policy "blog public read" on public.blog_posts for select using (published = true or public.is_admin());
drop policy if exists "blog admin write" on public.blog_posts;
create policy "blog admin write" on public.blog_posts for all
  using (public.is_admin()) with check (public.is_admin());

-- ---------- SHIPPING SETTINGS ----------
drop policy if exists "shipping public read" on public.shipping_settings;
create policy "shipping public read" on public.shipping_settings for select using (true);
drop policy if exists "shipping admin write" on public.shipping_settings;
create policy "shipping admin write" on public.shipping_settings for all
  using (public.is_admin()) with check (public.is_admin());

-- ---------- ORDERS ----------
-- La orden la crea la Edge Function checkout-mp con service-role (no el cliente),
-- por eso NO hay política de insert para anon/authenticated.
-- Leer la propia orden (o admin)
drop policy if exists "orders read own" on public.orders;
create policy "orders read own" on public.orders for select
  using (public.is_admin() or auth.uid() = user_id);
-- Admin: marcar enviada / limpiar
drop policy if exists "orders admin update" on public.orders;
create policy "orders admin update" on public.orders for update
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "orders admin delete" on public.orders;
create policy "orders admin delete" on public.orders for delete using (public.is_admin());

-- NOTA: las Edge Functions usan service-role y NO pasan por RLS
-- (marcar pagada, descontar stock, registrar emails). Eso queda intacto.

-- ---------- STORAGE: subida de imágenes por admin ----------
-- Bucket 'product-images'. El admin sube directo desde el navegador.
drop policy if exists "product-images admin upload" on storage.objects;
create policy "product-images admin upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "product-images public read" on storage.objects;
create policy "product-images public read" on storage.objects for select
  using (bucket_id = 'product-images');
