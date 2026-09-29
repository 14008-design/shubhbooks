import { createFileRoute } from "@tanstack/react-router";

// Private CSV of visitor questions. Generated fresh on every open, so it is always up to date.
export const Route = createFileRoute("/api/public/questions-report")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { REPORT_KEY } = await import("@/lib/report-key.server");
        const key = new URL(request.url).searchParams.get("key");
        if (key !== REPORT_KEY) return new Response("Not found", { status: 404 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("chat_questions")
          .select("asked_at,book,question")
          .order("asked_at", { ascending: false })
          .limit(5000);
        if (error) return new Response(error.message, { status: 500 });
        const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
        const rows = (data ?? []).map((r) =>
          [esc(new Date(r.asked_at).toISOString().replace("T", " ").slice(0, 19) + " UTC"), esc(r.book), esc(r.question)].join(","),
        );
        const csv = ["Asked at,Book,Question", ...rows].join("\n");
        return new Response(csv, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="visitor-questions-${new Date().toISOString().slice(0, 10)}.csv"`,
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
