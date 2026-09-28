CREATE TABLE public.book_view_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id text NOT NULL,
  total_views integer NOT NULL,
  snapshot_date date NOT NULL DEFAULT current_date,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (book_id, snapshot_date)
);
GRANT SELECT ON public.book_view_snapshots TO anon, authenticated;
GRANT ALL ON public.book_view_snapshots TO service_role;
ALTER TABLE public.book_view_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read view snapshots" ON public.book_view_snapshots FOR SELECT TO anon, authenticated USING (true);
INSERT INTO public.book_view_snapshots (book_id, total_views) VALUES ('fox', 322), ('rao', 132);