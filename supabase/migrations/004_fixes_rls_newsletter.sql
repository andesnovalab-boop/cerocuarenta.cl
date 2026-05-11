-- ════════════════════════════════════════════════════════════════
-- CeroCuarenta — Fix RLS guest orders + tabla newsletter_subscribers
-- Ejecutar en Supabase > SQL Editor
-- ════════════════════════════════════════════════════════════════

-- ── FIX: RLS orders — permitir guest checkout (user_id IS NULL) ──
drop policy if exists "orders_insert_auth" on orders;

create policy "orders_insert_auth" on orders for insert with check (
  auth.uid() = user_id OR user_id IS NULL
);

-- ── NEWSLETTER SUBSCRIBERS ────────────────────────────────────────
create table if not exists newsletter_subscribers (
  id         uuid default gen_random_uuid() primary key,
  email      text unique not null,
  created_at timestamptz default now()
);

alter table newsletter_subscribers enable row level security;

drop policy if exists "newsletter_insert_all" on newsletter_subscribers;
drop policy if exists "admin_full_newsletter"  on newsletter_subscribers;

create policy "newsletter_insert_all" on newsletter_subscribers for insert with check (true);
create policy "admin_full_newsletter" on newsletter_subscribers for all using (
  exists (select 1 from users where id = auth.uid() and role = 'admin')
);
