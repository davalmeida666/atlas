-- ATLAS · Fase 2 · Proyectos y tareas

-- 1) TABLA DE PROYECTOS
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  description text,
  due_at timestamptz,
  created_at timestamptz not null default now()
);

-- 2) TABLA DE TAREAS (las subtareas usan parent_id)
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  parent_id uuid references public.tasks (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 300),
  notes text,
  status text not null default 'pendiente'
    check (status in ('pendiente', 'en_progreso', 'completada')),
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- 3) ÍNDICES (para que las búsquedas sigan siendo rápidas)
create index projects_user_id_idx on public.projects (user_id);
create index tasks_user_id_idx on public.tasks (user_id);
create index tasks_project_id_idx on public.tasks (project_id);
create index tasks_parent_id_idx on public.tasks (parent_id);

-- 4) SEGURIDAD: activar RLS
alter table public.projects enable row level security;
alter table public.tasks enable row level security;

-- 5) REGLAS: cada usuario solo toca sus propias filas
create policy "projects_select_own" on public.projects
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "projects_insert_own" on public.projects
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "projects_update_own" on public.projects
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "projects_delete_own" on public.projects
  for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "tasks_select_own" on public.tasks
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "tasks_insert_own" on public.tasks
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "tasks_update_own" on public.tasks
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "tasks_delete_own" on public.tasks
  for delete to authenticated
  using ((select auth.uid()) = user_id);