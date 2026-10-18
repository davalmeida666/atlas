-- ATLAS · Fase 5 · Ámbitos (scopes)

-- 1) TABLA DE ÁMBITOS
create table public.scopes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create index scopes_user_id_idx on public.scopes (user_id);

-- 2) SEGURIDAD: RLS, igual que projects y tasks
alter table public.scopes enable row level security;

create policy "scopes_select_own" on public.scopes
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "scopes_insert_own" on public.scopes
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "scopes_update_own" on public.scopes
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "scopes_delete_own" on public.scopes
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- 3) CONECTAR proyectos y tareas con su ámbito
alter table public.projects
  add column scope_id uuid references public.scopes (id) on delete set null;

alter table public.tasks
  add column scope_id uuid references public.scopes (id) on delete set null;