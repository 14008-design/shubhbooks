import { createFileRoute } from "@tanstack/react-router";
import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";

import { AUTHOR, BOOK_BASES, BRIBOOKS_URL, yearlyFromTotal } from "@/lib/book-data";
import { getBookProfiles, profilesToPrompt } from "@/lib/book-profiles.server";
import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "@/lib/ai/run-id.server";

async function loadStats() {
  const sb = createClient(import.meta.env["VITE_SUPABASE_URL"], import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"], {
    auth: { persistSession: false },
  });
  const { data } = await sb
    .from("book_view_snapshots")
    .select("book_id,total_views,snapshot_date")
    .order("snapshot_date", { ascending: false })
    .limit(60);
  return BOOK_BASES.map((b) => {
    const snaps = (data ?? []).filter((d) => d.book_id === b.id);
    const total = snaps[0]?.total_views ?? b.fallbackTotal;
    const yearly = yearlyFromTotal(b, total);
    return {
      title: b.label,
      author: AUTHOR,
      totalViews: total,
      viewsPerYear: yearly.map((v, i) => `Year ${i + 1}: ${v}${i === yearly.length - 1 ? " (current year, live)" : ""}`),
      recentDailyTotals: snaps.slice(0, 14).map((s) => `${s.snapshot_date}: ${s.total_views}`),
    };
  });
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => null)) as { messages?: UIMessage[] } | null;
        if (!body || !Array.isArray(body.messages) || body.messages.length > 60) {
          return new Response("Invalid request", { status: 400 });
        }
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("AI is not configured", { status: 500 });

        const [stats, profiles] = await Promise.all([loadStats(), getBookProfiles()]);
        const system = `You are the Book Views analyst for author ${AUTHOR}'s books on BriBooks (${BRIBOOKS_URL}).
Answer questions about the readership analytics below (views per book, per year, growth, comparisons, trends, simple projections),
and also about what each book is about and who the author is, using the book previews and author introductions below.
Be warm, concise and encouraging (the author is a young writer). Use short paragraphs or bullets, and show numbers.
Only use the information given; if asked something outside it, say so briefly. Label any projection as an estimate.
Don't invent plot details beyond the preview — say the full story is on BriBooks.

Current view data (JSON): ${JSON.stringify(stats)}

Books and author (from BriBooks):
${profilesToPrompt(profiles)}`;

        const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
        const provider = createOpenAI({
          baseURL: "https://ai.gateway.lovable.dev/v1",
          apiKey,
          headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
          fetch: runIdFetch.fetch,
        });
        const result = streamText({
          model: provider.responses("openai/gpt-6-astra"),
          system,
          messages: await convertToModelMessages(body.messages),
          abortSignal: request.signal,
          providerOptions: {
            openai: {
              forceReasoning: true,
              reasoningEffort: "low",
              reasoningSummary: "auto",
              store: false,
              include: ["reasoning.encrypted_content"],
            },
          },
        });
        return withLovableAiGatewayRunIdHeader(
          result.toUIMessageStreamResponse({
            originalMessages: body.messages,
            onError: (e) => {
              const msg = e instanceof Error ? e.message : String(e);
              if (msg.includes("402")) return "The AI is out of credits right now. Please try again later.";
              if (msg.includes("429")) return "Too many questions at once — please wait a moment and try again.";
              return "Sorry, the analyst couldn't answer just now.";
            },
          }),
          runIdFetch,
        );
      },
    },
  },
});
