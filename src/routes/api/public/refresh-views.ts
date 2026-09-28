import { createFileRoute } from "@tanstack/react-router";

import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";
import { fetchLiveViews } from "@/lib/bribooks.server";

export const Route = createFileRoute("/api/public/refresh-views")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await authenticateCronRequest(request);
        if (denied) return denied;

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
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin
          .from("book_view_snapshots")
          .upsert(rows, { onConflict: "book_id,snapshot_date" });
        if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
        return Response.json({ ok: true, updated: live });
      },
    },
  },
});
