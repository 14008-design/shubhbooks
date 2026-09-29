CREATE TABLE public.chat_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  book text NOT NULL DEFAULT 'General',
  asked_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.chat_questions TO service_role;
ALTER TABLE public.chat_questions ENABLE ROW LEVEL SECURITY;