import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

import foxCover from "@/assets/fox-cover.avif.asset.json";
import raoCover from "@/assets/rao-cover.avif.asset.json";
import { getLatestSnapshots } from "@/lib/snapshots.functions";

const ANALYTICS_URL = "https://lovely-web-slider.lovable.app/book-views";
const FOX_STORE_URL = "https://www.bribooks.com/bookstore/the-fox-and-cub/";
const RAO_STORE_URL = "https://www.bribooks.com/bookstore/rao-s-expedition-book/";

const FALLBACK_VIEWS = 350;

export default function PromoScreen() {
  const [views, setViews] = useState<number>(FALLBACK_VIEWS);

  useEffect(() => {
    const load = () =>
      getLatestSnapshots()
        .catch(() => [])
        .then((rows) => {
          const fox = rows?.find((r) => r.book_id === "fox");
          if (fox && fox.total_views > 0) setViews(fox.total_views);
          return rows?.[0]?.fetched_at as string | undefined;
        });
    void load().then((latest) => {
      // Same rule as the analytics page: refresh when the newest count is
      // older than 30 minutes, so this page also pulls live BriBooks totals.
      const cutoff = Date.now() - 30 * 60 * 1000;
      if (latest && new Date(latest).getTime() >= cutoff) return;
      void fetch("/api/public/refresh-views", {
        method: "POST",
        headers: { apikey: import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] },
      })
        .then((r) => (r.ok ? load() : undefined))
        .catch(() => undefined);
    });
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <section className="w-full max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-2xl sm:p-10">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          A story by a young author
        </p>
        <h1 className="mt-3 text-center font-serif text-3xl font-bold leading-tight sm:text-5xl">
          The Fox and the Cub
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground sm:text-base">
          by <span className="font-semibold text-foreground">Shubhang Mishra</span> · Seth M.R. Jaipuria School
        </p>

        <div className="mt-8 flex flex-col items-center gap-8 sm:flex-row sm:items-start">
          <a
            href={FOX_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View The Fox and the Cub on BriBooks"
            className="shrink-0 transition-transform hover:-translate-y-1"
          >
            <img
              src={foxCover.url}
              alt="The Fox and the Cub book cover"
              className="w-44 rounded-lg border border-border shadow-xl sm:w-52"
            />
          </a>

          <div className="flex flex-1 flex-col items-center gap-5 text-center sm:items-start sm:text-left">
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              A heartwarming forest adventure — and you can watch its reader
              count grow <span className="font-semibold text-foreground">live</span>.
            </p>

            <div className="rounded-xl border border-border bg-background px-6 py-4">
              <p className="font-serif text-4xl font-bold tabular-nums sm:text-5xl">
                {views.toLocaleString()}
              </p>
              <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                readers and counting — live from BriBooks
              </p>
            </div>

            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <div className="rounded-xl bg-white p-3 shadow-lg">
                <QRCodeSVG value={ANALYTICS_URL} size={132} level="M" />
              </div>
              <div className="text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">Scan with your phone</p>
                <p>
                  to open the live analytics, ask the AI about the story and
                  the author, then jump to the book on BriBooks.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3 sm:justify-start">
              <a
                href={ANALYTICS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-85"
              >
                See the live reader stats
              </a>
              <a
                href={FOX_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center rounded-md border border-border px-5 py-2 text-sm font-semibold transition-opacity hover:opacity-75"
              >
                Preview &amp; buy on BriBooks ↗
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center gap-4 rounded-xl border border-border bg-background p-4">
          <img
            src={raoCover.url}
            alt="Rao's Expedition Book cover"
            className="w-14 rounded border border-border"
          />
          <p className="flex-1 text-sm text-muted-foreground">
            Also by Shubhang: <span className="font-semibold text-foreground">Rao’s Expedition Book</span> — a thrilling journey for young explorers.
          </p>
          <a
            href={RAO_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-sm font-semibold underline underline-offset-4 hover:opacity-75"
          >
            View ↗
          </a>
        </div>
      </section>
    </main>
  );
}
