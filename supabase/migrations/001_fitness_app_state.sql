create table if not exists public.fitness_app_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile jsonb not null,
  series jsonb not null default '[]'::jsonb,
  sessions jsonb not null default '[]'::jsonb,
  template_library jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.fitness_app_state enable row level security;

create policy "Users can read their fitness app state"
on public.fitness_app_state
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their fitness app state"
on public.fitness_app_state
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their fitness app state"
on public.fitness_app_state
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their fitness app state"
on public.fitness_app_state
for delete
to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists fitness_app_state_updated_at on public.fitness_app_state;

create trigger fitness_app_state_updated_at
before update on public.fitness_app_state
for each row
execute function public.set_updated_at();
