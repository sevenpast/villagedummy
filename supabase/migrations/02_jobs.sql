-- Classification jobs table
create table if not exists public.classification_jobs (
  id bigserial primary key,
  document_id uuid not null references public.documents(id) on delete cascade,
  created_at timestamptz not null default now(),
  locked_at timestamptz,
  attempts int not null default 0
);

create index on public.classification_jobs (created_at);
create index on public.classification_jobs (locked_at);

-- Review queue for low-confidence documents
create table if not exists public.review_queue (
  id bigserial primary key,
  document_id uuid not null references public.documents(id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.classification_jobs enable row level security;
alter table public.review_queue enable row level security;

-- Jobs and review queue are server-only (no client access)
revoke all on public.classification_jobs from authenticated;
revoke all on public.review_queue from authenticated;

-- Auto-enqueue classification job when document is inserted
create or replace function public.enqueue_classification_job()
returns trigger language plpgsql security definer as $$
begin
  insert into public.classification_jobs (document_id) values (new.id);
  return new;
end; $$;

drop trigger if exists trg_documents_enqueue_job on public.documents;
create trigger trg_documents_enqueue_job
after insert on public.documents
for each row execute procedure public.enqueue_classification_job();
