import { createFileRoute } from "@tanstack/react-router";

import { fetchLiveViews } from "@/lib/bribooks.server";

// Called once a day by the scheduler. It only copies public BriBooks view counts,
// is idempotent per day, and refuses to run more than once every 12 hours.
export const Route = createFileRoute("/api/public/refresh-views")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = request.headers.get("apikey");
        if (!key || (key !== process.env["SUPABASE_PUBLISHABLE_KEY"] && key !== process.env["VITE_SUPABASE_PUBLISHABLE_KEY"])) {
          return new Response("Unauthorized", { status: 401 });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: last } = await supabaseAdmin
          .from("book_view_snapshots")
          .select("fetched_at")
          .order("fetched_at", { ascending: false })
          .limit(1);
        if (last?.[0] && Date.now() - new Date(last[0].fetched_at).getTime() < 12 * 3600 * 1000) {
          return Response.json({ ok: true, skipped: "recently updated" });
        }

        const live = await fetchLiveViews();
        const rows = Object.entries(live).map(([book_id, total_views]) => ({
          book_id,
          total_views,
          snapshot_date: new Date().toISOString().slice(0, 10),
          fetched_at: new Date().toISOString(),
        }));
        if (rows.length === 0) {
          return Response.json({ ok: false, error: "No matching books found" }, { status: 502 });
        }
        const { error } = await supabaseAdmin
          .from("book_view_snapshots")
          .upsert(rows, { onConflict: "book_id,snapshot_date" });
        if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
        return Response.json({ ok: true, updated: live });
      },
    },
  },
});
