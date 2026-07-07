-- Workspace data table — one row per (user, key) pair.
-- Stores JSON blobs for characters, locations, worldbuilding, outline, ideas, goals, citations.

create table if not exists public.workspace_data (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  key        text not null,
  data       jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, key)
);

-- Update updated_at automatically on every write
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger workspace_data_updated_at
  before update on public.workspace_data
  for each row execute procedure public.set_updated_at();

-- Row Level Security — every user can only see and modify their own rows
alter table public.workspace_data enable row level security;

create policy "Users manage own workspace data"
  on public.workspace_data
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
