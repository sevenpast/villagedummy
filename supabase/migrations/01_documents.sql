-- Documents table with proper architecture
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  storage_bucket text not null default 'documents',
  storage_path text not null,              -- e.g. user_id/uuid/filename.pdf
  mime_type text not null,
  size_bytes bigint not null,
  status text not null default 'uploaded', -- uploaded|processing|done|error
  primary_tag text,                        -- e.g. 'passport'
  secondary_tags text[] default '{}',
  confidence numeric check (confidence between 0 and 1),
  signals jsonb default '{}',              -- heuristics & model signals
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.documents (user_id, created_at desc);
create index on public.documents (status);
create index on public.documents (primary_tag);

-- Enable RLS
alter table public.documents enable row level security;

-- Users can only see their own documents
create policy "users_select_own_docs"
on public.documents for select
to authenticated
using (auth.uid() = user_id);

create policy "users_insert_own_docs"
on public.documents for insert
to authenticated
with check (auth.uid() = user_id);

create policy "users_update_own_docs"
on public.documents for update
to authenticated
using (auth.uid() = user_id);

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists trg_documents_updated_at on public.documents;
create trigger trg_documents_updated_at
before update on public.documents
for each row execute procedure public.set_updated_at();
