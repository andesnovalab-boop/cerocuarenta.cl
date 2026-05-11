-- ════════════════════════════════════════════════════════════════
-- CeroCuarenta — Schema completo e-commerce
-- Versión idempotente: se puede correr múltiples veces sin errores
-- ════════════════════════════════════════════════════════════════

-- ── EXTENSIONES ──────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── USERS ────────────────────────────────────────────────────────
create table if not exists users (
  id           uuid references auth.users(id) on delete cascade primary key,
  email        text,
  display_name text,
  role         text not null default 'customer' check (role in ('admin', 'customer')),
  created_at   timestamptz default now()
);

alter table users enable row level security;

drop policy if exists "users_select_own"  on users;
drop policy if exists "users_update_own"  on users;
drop policy if exists "admin_full_users"  on users;

create policy "users_select_own" on users for select using (auth.uid() = id);
create policy "users_update_own" on users for update using (auth.uid() = id);
create policy "admin_full_users" on users for all using (
  exists (select 1 from users u where u.id = auth.uid() and u.role = 'admin')
);

-- Trigger: auto-crear perfil al registrarse
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    case when new.email = 'juanplazabravo@gmail.com' then 'admin' else 'customer' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ── PRODUCTS ─────────────────────────────────────────────────────
create table if not exists products (
  id           uuid default gen_random_uuid() primary key,
  name         text not null,
  description  text,
  price        integer not null,
  stock        integer not null default 0,
  sizes        jsonb default '{}',
  images       text[] default '{}',
  category     text not null check (category in ('Polera','Poleron','Pantalon','Short','Gorro','Accesorio')),
  active       boolean default true,
  featured     boolean default false,
  measurements jsonb default '{}',
  created_at   timestamptz default now()
);

-- Agregar columna featured si no existe (para bases ya creadas)
alter table products add column if not exists featured boolean default false;
alter table products add column if not exists measurements jsonb default '{}';

alter table products enable row level security;

drop policy if exists "products_public_read" on products;
drop policy if exists "admin_full_products"  on products;

create policy "products_public_read" on products for select using (active = true);
create policy "admin_full_products" on products for all using (
  exists (select 1 from users where id = auth.uid() and role = 'admin')
);

-- ── ORDERS ───────────────────────────────────────────────────────
create table if not exists orders (
  id               uuid default gen_random_uuid() primary key,
  user_id          uuid references auth.users(id),
  customer_email   text,
  items            jsonb not null default '[]',
  subtotal         integer,
  shipping_cost    integer default 0,
  shipping_method  text,
  total            integer not null,
  status           text not null default 'pending'
                     check (status in ('pending','paid','shipped','delivered','cancelled')),
  payment_id       text,
  paid_at          timestamptz,
  payment_data     jsonb,
  shipping_address jsonb not null default '{}',
  notes            text,
  created_at       timestamptz default now()
);

alter table orders enable row level security;

drop policy if exists "orders_own"          on orders;
drop policy if exists "orders_insert_auth"  on orders;
drop policy if exists "admin_full_orders"   on orders;

create policy "orders_own"         on orders for select using (auth.uid() = user_id);
create policy "orders_insert_auth" on orders for insert with check (auth.uid() = user_id OR user_id IS NULL);
create policy "admin_full_orders"  on orders for all using (
  exists (select 1 from users where id = auth.uid() and role = 'admin')
);

-- ── SHIPPING SETTINGS ────────────────────────────────────────────
create table if not exists shipping_settings (
  id                      uuid default gen_random_uuid() primary key,
  rm                      jsonb default '{"name":"Región Metropolitana","price":3990}',
  region                  jsonb default '{"name":"Regiones","price":5990}',
  free_shipping_threshold integer default 80000,
  conditions              text default 'Despacho en 3-5 días hábiles.',
  updated_at              timestamptz default now()
);

alter table shipping_settings enable row level security;

drop policy if exists "shipping_public_read" on shipping_settings;
drop policy if exists "admin_full_shipping"  on shipping_settings;

create policy "shipping_public_read" on shipping_settings for select using (true);
create policy "admin_full_shipping"  on shipping_settings for all using (
  exists (select 1 from users where id = auth.uid() and role = 'admin')
);

insert into shipping_settings (rm, region, free_shipping_threshold, conditions)
select
  '{"name":"Región Metropolitana","price":3990}',
  '{"name":"Regiones","price":5990}',
  80000,
  'Despacho en 3-5 días hábiles a través de Starken o Correos de Chile.'
where not exists (select 1 from shipping_settings);

-- ── EMAILS (log) ─────────────────────────────────────────────────
create table if not exists emails (
  id       uuid default gen_random_uuid() primary key,
  to_email text,
  subject  text,
  template text,
  order_id uuid,
  status   text default 'pending',
  sent_at  timestamptz default now()
);

alter table emails enable row level security;

drop policy if exists "admin_full_emails" on emails;

create policy "admin_full_emails" on emails for all using (
  exists (select 1 from users where id = auth.uid() and role = 'admin')
);

-- ── BLOG POSTS ───────────────────────────────────────────────────
create table if not exists blog_posts (
  id          uuid default gen_random_uuid() primary key,
  title       text not null,
  slug        text unique not null,
  excerpt     text,
  content     text,
  cover_image text,
  category    text default 'Cultura'
                check (category in ('Cultura','Tennis','Moda','Drops','Noticias')),
  author      text default 'CeroCuarenta',
  published   boolean default false,
  created_at  timestamptz default now()
);

alter table blog_posts enable row level security;

drop policy if exists "blog_public_read" on blog_posts;
drop policy if exists "admin_full_blog"  on blog_posts;

create policy "blog_public_read" on blog_posts for select using (published = true);
create policy "admin_full_blog"  on blog_posts for all using (
  exists (select 1 from users where id = auth.uid() and role = 'admin')
);

create index if not exists blog_posts_slug_idx on blog_posts (slug);

-- ════════════════════════════════════════════════════════════════
-- SEED: 7 productos con fotos reales (solo si la tabla está vacía)
-- ════════════════════════════════════════════════════════════════

insert into products (name, description, price, stock, sizes, images, category, featured, measurements)
select * from (values

  (
    'Polera Algarrobo',
    'Nuestra pieza icónica. Confeccionada en algodón pima 180g con acabado vintage. Corte oversized inspirado en las camisetas de tenis de los años 90. Perfecta dentro y fuera de la cancha.',
    39990, 45,
    '{"S":10,"M":15,"L":15,"XL":5}'::jsonb,
    ARRAY['/images/algarrobo-0.jpg','/images/algarrobo-1.jpg','/images/algarrobo-2.jpg','/images/algarrobo-3.jpg'],
    'Polera', true,
    '{"S":{"Ancho":"50","Largo":"70","Hombros":"46"},"M":{"Ancho":"53","Largo":"72","Hombros":"48"},"L":{"Ancho":"56","Largo":"74","Hombros":"50"},"XL":{"Ancho":"59","Largo":"76","Hombros":"52"}}'::jsonb
  ),
  (
    'Polera Game Set',
    'El set perfecto para el jugador que no descansa. Algodón premium con gráficos bordados de la cancha de tenis. Fit regular con costuras reforzadas para mayor durabilidad.',
    34990, 30,
    '{"S":8,"M":12,"L":8,"XL":2}'::jsonb,
    ARRAY['/images/algarrobo-4.jpg','/images/algarrobo-5.jpg','/images/algarrobo-6.jpg'],
    'Polera', false,
    '{"S":{"Ancho":"51","Largo":"69","Hombros":"46"},"M":{"Ancho":"54","Largo":"71","Hombros":"48"},"L":{"Ancho":"57","Largo":"73","Hombros":"50"},"XL":{"Ancho":"60","Largo":"75","Hombros":"52"}}'::jsonb
  ),
  (
    'Poleron Net',
    'Calor sin renunciar al estilo. Fleece pesado 320g con acabado suave al interior. Bordado de la red de tenis en el pecho. El compañero ideal para los días fríos de entrenamiento.',
    59990, 25,
    '{"S":5,"M":10,"L":8,"XL":2}'::jsonb,
    ARRAY['/images/algarrobo-7.jpg','/images/algarrobo-8.jpg','/images/algarrobo-9.jpg','/images/algarrobo-10.jpg'],
    'Poleron', true,
    '{"S":{"Ancho":"56","Largo":"68","Manga":"60"},"M":{"Ancho":"59","Largo":"70","Manga":"62"},"L":{"Ancho":"62","Largo":"72","Manga":"64"},"XL":{"Ancho":"65","Largo":"74","Manga":"66"}}'::jsonb
  ),
  (
    'Short Court',
    'Libertad de movimiento total. Tela técnica con tecnología de secado rápido y bolsillos laterales con cierre. El short que usarías tanto en la cancha como en la calle.',
    29990, 40,
    '{"S":10,"M":15,"L":12,"XL":3}'::jsonb,
    ARRAY['/images/algarrobo-11.jpg','/images/algarrobo-12.jpg','/images/algarrobo-13.jpg'],
    'Short', false,
    '{"S":{"Cintura":"76","Cadera":"96","Largo":"42"},"M":{"Cintura":"80","Cadera":"100","Largo":"43"},"L":{"Cintura":"84","Cadera":"104","Largo":"44"},"XL":{"Cintura":"88","Cadera":"108","Largo":"45"}}'::jsonb
  ),
  (
    'Gorro Forty',
    'El accesorio definitivo del Club. Structured 6-panel con bordado "0-40" en el frente. Ajuste universal.',
    19990, 60,
    '{"Talla Única":60}'::jsonb,
    ARRAY['/images/algarrobo-14.jpg','/images/algarrobo-15.jpg'],
    'Gorro', true,
    '{}'::jsonb
  ),
  (
    'Polera Drop 02',
    'Segunda entrega de nuestra colección Drop. Gráfica exclusiva "Pressure is a Privilege" en serigrafía de agua. Algodón orgánico 200g. Edición limitada de 50 unidades.',
    44990, 20,
    '{"S":5,"M":8,"L":5,"XL":2}'::jsonb,
    ARRAY['/images/algarrobo-16.jpg','/images/algarrobo-17.jpg','/images/algarrobo-18.jpg'],
    'Polera', true,
    '{"S":{"Ancho":"52","Largo":"71","Hombros":"47"},"M":{"Ancho":"55","Largo":"73","Hombros":"49"},"L":{"Ancho":"58","Largo":"75","Hombros":"51"},"XL":{"Ancho":"61","Largo":"77","Hombros":"53"}}'::jsonb
  ),
  (
    'Pantalón Match',
    'El pantalón técnico del Club. Tela liviana con elástico en cintura y cordón ajustable. Bolsillos laterales con cierre y etiqueta bordada CeroCuarenta en el tobillo.',
    49990, 20,
    '{"S":4,"M":8,"L":6,"XL":2}'::jsonb,
    ARRAY['/images/algarrobo-19.jpg','/images/algarrobo-20.jpg','/images/algarrobo-21.jpg','/images/algarrobo-22.jpg'],
    'Pantalon', false,
    '{"S":{"Cintura":"76","Cadera":"96","Largo":"98"},"M":{"Cintura":"80","Cadera":"100","Largo":"100"},"L":{"Cintura":"84","Cadera":"104","Largo":"102"},"XL":{"Cintura":"88","Cadera":"108","Largo":"104"}}'::jsonb
  )

) as v(name, description, price, stock, sizes, images, category, featured, measurements)
where not exists (select 1 from products limit 1);
