-- Ejecutar en Supabase Dashboard -> SQL Editor.
-- Reemplazá admin@tudominio.com por el email del usuario administrador.

create table if not exists public.portfolio_content (
  id text primary key check (id = 'main'),
  content jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.portfolio_content enable row level security;

grant select on public.portfolio_content to anon, authenticated;
grant insert, update, delete on public.portfolio_content to authenticated;

drop policy if exists "Anyone can read portfolio" on public.portfolio_content;
create policy "Anyone can read portfolio"
  on public.portfolio_content
  for select
  to anon, authenticated
  using (id = 'main');

drop policy if exists "Portfolio admin can manage content" on public.portfolio_content;
create policy "Portfolio admin can manage content"
  on public.portfolio_content
  for all
  to authenticated
  using (
    id = 'main'
    and lower((select auth.jwt() ->> 'email')) = lower('megninit@gmail.com')
  )
  with check (
    id = 'main'
    and lower((select auth.jwt() ->> 'email')) = lower('megninit@gmail.com')
  );
