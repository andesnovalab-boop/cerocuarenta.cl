-- ════════════════════════════════════════
-- CeroCuarenta — El Raquetero (Blog)
-- Ejecutar en Supabase > SQL Editor
-- ════════════════════════════════════════

create table if not exists blog_posts (
  id           uuid default gen_random_uuid() primary key,
  title        text not null,
  slug         text unique not null,
  excerpt      text,
  content      text,
  cover_image  text,
  category     text default 'Cultura'
                 check (category in ('Cultura','Tennis','Moda','Drops','Noticias')),
  author       text default 'CeroCuarenta',
  published    boolean default false,
  created_at   timestamptz default now()
);

-- RLS: lectura pública solo para publicados
alter table blog_posts enable row level security;

create policy "Leer publicados"
  on blog_posts for select
  using (published = true);

create policy "Admin full access"
  on blog_posts for all
  using (
    exists (
      select 1 from users
      where users.id = auth.uid()
        and users.role = 'admin'
    )
  );

-- Índice para búsqueda por slug
create index if not exists blog_posts_slug_idx on blog_posts (slug);
