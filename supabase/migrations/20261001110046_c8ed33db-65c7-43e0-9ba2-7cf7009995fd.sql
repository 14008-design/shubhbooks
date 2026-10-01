DROP POLICY IF EXISTS "Anyone can read view snapshots" ON public.book_view_snapshots;
REVOKE SELECT ON public.book_view_snapshots FROM anon, authenticated;