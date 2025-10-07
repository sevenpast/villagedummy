-- Classification jobs table
CREATE TABLE IF NOT EXISTS public.classification_jobs (
  id bigserial PRIMARY KEY,
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  locked_at timestamptz,
  attempts int NOT NULL DEFAULT 0
);

CREATE INDEX ON public.classification_jobs (created_at);
CREATE INDEX ON public.classification_jobs (locked_at);

-- Review queue for low-confidence documents
CREATE TABLE IF NOT EXISTS public.review_queue (
  id bigserial PRIMARY KEY,
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.classification_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_queue ENABLE ROW LEVEL SECURITY;

-- Jobs and review queue are server-only (no client access)
REVOKE ALL ON public.classification_jobs FROM authenticated;
REVOKE ALL ON public.review_queue FROM authenticated;

-- Auto-enqueue classification job when document is inserted
CREATE OR REPLACE FUNCTION public.enqueue_classification_job()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.classification_jobs (document_id) VALUES (new.id);
  RETURN new;
END; $$;

DROP TRIGGER IF EXISTS trg_documents_enqueue_job ON public.documents;
CREATE TRIGGER trg_documents_enqueue_job
AFTER INSERT ON public.documents
FOR EACH ROW EXECUTE PROCEDURE public.enqueue_classification_job();
