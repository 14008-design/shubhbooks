import { useMemo, useState, useCallback, useEffect } from "react";

import BookInsightsChat from "@/components/BookInsightsChat";
import { supabase } from "@/integrations/supabase/client";
import { AUTHOR, BOOK_BASES, BRIBOOKS_URL, yearlyFromTotal } from "@/lib/book-data";

type Book = {
  id: string;
  label: string;
  color: string;
  /** Yearly new views, index 0 = Year 1 */
  yearly: number[];
};

function useLiveTotals() {
  const [totals, setTotals] = useState<Record<string, number>>({});
  const [updated, setUpdated] = useState<string | null>(null);
  useEffect(() => {
    const load = () =>
      supabase
        .from("book_view_snapshots")
        .select("book_id,total_views,fetched_at")
        .order("fetched_at", { ascending: false })
        .limit(20)
        .then(({ data }) => {
          const t: Record<string, number> = {};
          for (const r of data ?? []) if (t[r.book_id] === undefined) t[r.book_id] = r.total_views;
          setTotals(t);
          if (data?.[0]) setUpdated(new Date(data[0].fetched_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }));
          return data?.[0]?.fetched_at as string | undefined;
        });
    void load().then((latest) => {
      // If the newest count isn't from today, fetch a fresh one from BriBooks.
      const today = new Date().toISOString().slice(0, 10);
      if (latest && latest.slice(0, 10) === today) return;
      void fetch("/api/public/refresh-views", {
        method: "POST",
        headers: { apikey: import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] },
      })
        .then((r) => (r.ok ? load() : undefined))
        .catch(() => undefined);
    });
  }, []);
  return { totals, updated };
}

const Y_MAX = 500;
const CHART_W = 720;
const CHART_H = 300;
const PAD_L = 44;
const PAD_R = 24;
const PAD_T = 24;
const PAD_B = 34;

function cumulative(yearly: number[]) {
  let sum = 0;
  return yearly.map((v) => (sum += v));
}

export default function BookViewsDashboard() {
  const [active, setActive] = useState<string[]>(BOOK_BASES.map((b) => b.id));
  const [hoverYear, setHoverYear] = useState<number | null>(null);
  const { totals, updated } = useLiveTotals();

  const series = useMemo(
    () =>
      BOOK_BASES.map((base): Book & { cum: number[]; total: number } => {
        const yearly = yearlyFromTotal(base, totals[base.id] ?? base.fallbackTotal);
        return {
          id: base.id,
          label: base.label,
          color: base.color,
          yearly,
          cum: cumulative(yearly),
          total: yearly.reduce((a, c) => a + c, 0),
        };
      }),
    [totals],
  );

  const maxYears = Math.max(...series.map((s) => s.yearly.length));
  const shown = series.filter((s) => active.includes(s.id));
  const totalViews = shown.reduce((a, s) => a + s.total, 0);

  const x = useCallback(
    (yearIndex: number) =>
      PAD_L + (yearIndex / (maxYears - 1)) * (CHART_W - PAD_L - PAD_R),
    [maxYears],
  );
  const y = useCallback(
    (value: number) =>
      CHART_H - PAD_B - (value / Y_MAX) * (CHART_H - PAD_T - PAD_B),
    [],
  );

  const toggle = (id: string) =>
    setActive((prev) =>
      prev.includes(id)
        ? prev.length === 1
          ? prev
          : prev.filter((p) => p !== id)
        : [...prev, id],
    );

  const gridLines = [0, 150, 300, 450, 500];

  const handleMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * CHART_W;
    const ratio = (px - PAD_L) / (CHART_W - PAD_L - PAD_R);
    const idx = Math.round(ratio * (maxYears - 1));
    setHoverYear(Math.min(maxYears - 1, Math.max(0, idx)));
  };

  return (
    <div className="bv-theme min-h-screen font-sans">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-5 py-4 sm:px-8"
        style={{ borderColor: "var(--bv-line)" }}>
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: "var(--bv-night)" }}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="white" strokeWidth="1.6">
              <path d="M12 6.5S9.5 4.5 4.5 4.5v13C9.5 17.5 12 19.5 12 19.5s2.5-2 7.5-2v-13C14.5 4.5 12 6.5 12 6.5Z" />
              <path d="M12 6.5v13" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-semibold tracking-[0.22em]" style={{ color: "var(--bv-ink-faint)" }}>
              BOOK VIEWS
            </p>
            <p className="font-display text-lg leading-tight">Analytics desk</p>
          </div>
        </div>
        <span
          className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium"
          style={{ borderColor: "var(--bv-line)", color: "var(--bv-ink-soft)" }}
        >
          <span className="h-2 w-2 rounded-full" style={{ background: "var(--bv-teal)" }} />
          {updated ? `Live from BriBooks · ${updated}` : "Live from BriBooks"}
        </span>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        {/* Hero */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p
              className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.22em]"
              style={{ color: "var(--bv-teal)" }}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                <rect x="3" y="12" width="4" height="9" rx="1" />
                <rect x="10" y="7" width="4" height="14" rx="1" />
                <rect x="17" y="3" width="4" height="18" rx="1" />
              </svg>
              YEAR-OVER-YEAR READERSHIP
            </p>
            <h1 className="font-display mt-4 text-4xl leading-[1.05] sm:text-5xl">
              A clear view of
              <br />
              <span style={{ color: "var(--bv-coral)" }}>books in motion.</span>
            </h1>
            <p className="mt-5 text-sm leading-relaxed sm:text-base" style={{ color: "var(--bv-ink-soft)" }}>
              Track cumulative views across every year of a book&rsquo;s journey. Tap a title to
              isolate it, or hover the chart to read any year.
            </p>
          </div>
          <div className="border-l pl-5" style={{ borderColor: "var(--bv-coral)" }}>
            <p className="text-[10px] font-semibold tracking-[0.22em]" style={{ color: "var(--bv-ink-faint)" }}>
              CURRENT HORIZON
            </p>
            <p className="font-display text-2xl">Years 1&ndash;{maxYears}</p>
          </div>
        </div>

        {/* Chart + snapshot */}
        <div className="mt-10 grid gap-6 lg:grid-cols-[1.7fr_1fr]">
          <section
            className="rounded-2xl border p-5 sm:p-6"
            style={{ borderColor: "var(--bv-line)", background: "var(--bv-surface)" }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.2em]" style={{ color: "var(--bv-ink-faint)" }}>
                  CUMULATIVE PERFORMANCE
                </p>
                <h2 className="font-display mt-1 text-2xl">Views by year</h2>
              </div>
              <span
                className="rounded-md border px-2.5 py-1 font-mono text-[11px]"
                style={{ borderColor: "var(--bv-line)", color: "var(--bv-ink-soft)" }}
              >
                Y-AXIS MAX · {Y_MAX}
              </span>
            </div>

            {/* Legend / toggles */}
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              {series.map((s) => {
                const on = active.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggle(s.id)}
                    aria-pressed={on}
                    className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all"
                    style={{
                      borderColor: on ? s.color : "var(--bv-line)",
                      color: on ? s.color : "var(--bv-ink-faint)",
                      opacity: on ? 1 : 0.6,
                    }}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: on ? s.color : "var(--bv-ink-faint)" }}
                    />
                    {s.label}
                  </button>
                );
              })}
            </div>

            <svg
              viewBox={`0 0 ${CHART_W} ${CHART_H}`}
              className="mt-3 w-full touch-none select-none"
              role="img"
              aria-label="Cumulative book views by year"
              onPointerMove={handleMove}
              onPointerDown={handleMove}
              onPointerLeave={() => setHoverYear(null)}
            >
              <defs>
                {series.map((s) => (
                  <linearGradient key={s.id} id={`bv-fill-${s.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={s.color} stopOpacity="0.22" />
                    <stop offset="100%" stopColor={s.color} stopOpacity="0" />
                  </linearGradient>
                ))}
              </defs>

              {/* Grid */}
              {gridLines.map((g) => (
                <g key={g}>
                  <line
                    x1={PAD_L}
                    x2={CHART_W - PAD_R}
                    y1={y(g)}
                    y2={y(g)}
                    stroke="var(--bv-line)"
                    strokeDasharray="2 5"
                  />
                  <text x={PAD_L - 10} y={y(g) + 4} textAnchor="end" fontSize="11" fill="var(--bv-ink-faint)">
                    {g}
                  </text>
                </g>
              ))}

              {/* Year labels + hover guide */}
              {Array.from({ length: maxYears }, (_, i) => (
                <g key={i}>
                  {hoverYear === i && (
                    <line
                      x1={x(i)}
                      x2={x(i)}
                      y1={PAD_T}
                      y2={CHART_H - PAD_B}
                      stroke="var(--bv-ink-faint)"
                      strokeWidth="1"
                    />
                  )}
                  <text
                    x={x(i)}
                    y={CHART_H - 10}
                    textAnchor={i === 0 ? "start" : i === maxYears - 1 ? "end" : "middle"}
                    fontSize="11"
                    fill={hoverYear === i ? "var(--bv-ink)" : "var(--bv-ink-faint)"}
                    fontWeight={hoverYear === i ? 600 : 400}
                  >
                    Year {i + 1}
                  </text>
                </g>
              ))}

              {/* Series */}
              {shown.map((s) => {
                const pts = s.cum.map((v, i) => `${x(i)},${y(v)}`).join(" ");
                const areaPts = `${x(0)},${y(0)} ${pts} ${x(s.cum.length - 1)},${y(0)}`;
                return (
                  <g key={s.id}>
                    <polygon points={areaPts} fill={`url(#bv-fill-${s.id})`} />
                    <polyline
                      points={pts}
                      fill="none"
                      stroke={s.color}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {s.cum.map((v, i) => (
                      <circle
                        key={i}
                        cx={x(i)}
                        cy={y(v)}
                        r={hoverYear === i ? 5.5 : 3}
                        fill="var(--bv-surface)"
                        stroke={s.color}
                        strokeWidth="2.5"
                      />
                    ))}
                    {hoverYear !== null && s.cum[hoverYear] !== undefined && (
                      <text
                        x={x(hoverYear)}
                        y={y(s.cum[hoverYear]) - 14}
                        textAnchor="middle"
                        fontSize="12"
                        fontWeight="600"
                        fill={s.color}
                      >
                        {s.cum[hoverYear]}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Readout strip */}
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {shown.map((s) => {
                const i = hoverYear ?? s.yearly.length - 1;
                const delta = s.yearly[i];
                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-xs"
                    style={{ background: "var(--bv-paper)" }}
                  >
                    <span style={{ color: "var(--bv-ink-soft)" }}>
                      {s.label} · Year {i + 1}
                    </span>
                    <span className="font-mono font-semibold" style={{ color: s.color }}>
                      {delta === undefined ? "—" : `+${delta} views`}
                    </span>
                  </div>
                );
              })}
            </div>

            <div
              className="mt-4 flex justify-between border-t pt-3 text-[10px] font-semibold tracking-[0.18em]"
              style={{ borderColor: "var(--bv-line)", color: "var(--bv-ink-faint)" }}
            >
              <span>TIMELINE · YEARS</span>
              <span>CUMULATIVE VIEWS</span>
            </div>
          </section>

          {/* Snapshot */}
          <aside
            className="flex flex-col rounded-2xl p-6 text-white"
            style={{ background: "var(--bv-night)" }}
          >
            <div className="flex items-start justify-between">
              <p className="text-[10px] font-semibold tracking-[0.2em] opacity-60">DESK SNAPSHOT</p>
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="var(--bv-coral)" strokeWidth="2">
                <path d="M7 17 17 7M9 7h8v8" />
              </svg>
            </div>
            <p className="mt-8 text-sm opacity-70">Total tracked views</p>
            <p className="font-display text-6xl leading-none">{totalViews}</p>
            <div className="mt-auto space-y-0 pt-10">
              <Stat label="Books in view" value={String(shown.length)} />
              <Stat label="Longest horizon" value={`${maxYears} years`} />
              <Stat label="Most recent year" value={`Year ${maxYears}`} last />
            </div>
          </aside>
        </div>

        {/* Book cards */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {series.map((s, idx) => {
            const on = active.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggle(s.id)}
                className="rounded-2xl border p-6 text-left transition-all hover:-translate-y-0.5"
                style={{
                  borderColor: on ? s.color : "var(--bv-line)",
                  background: "var(--bv-surface)",
                  opacity: on ? 1 : 0.65,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.2em]"
                    style={{ color: "var(--bv-ink-faint)" }}>
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                    BOOK 0{idx + 1}
                  </span>
                  <span className="text-[10px] font-semibold tracking-[0.16em]" style={{ color: s.color }}>
                    {on ? "SHOWING" : "HIDDEN"}
                  </span>
                </div>
                <h3 className="font-display mt-2 text-2xl">{s.label}</h3>
                <p className="mt-1 text-xs" style={{ color: "var(--bv-ink-soft)" }}>
                  by <span className="font-semibold">{AUTHOR}</span> ·{" "}
                  <a
                    href={BRIBOOKS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="underline underline-offset-2"
                    style={{ color: s.color }}
                  >
                    BriBooks store
                  </a>
                </p>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-semibold tracking-[0.2em]" style={{ color: "var(--bv-ink-faint)" }}>
                      VIEWS
                    </p>
                    <p className="font-display text-4xl">{s.total}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold tracking-[0.2em]" style={{ color: "var(--bv-ink-faint)" }}>
                      TIMELINE
                    </p>
                    <p className="font-display text-4xl">
                      {s.yearly.length}
                      <span className="text-base" style={{ color: "var(--bv-ink-faint)" }}> yrs</span>
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex items-end gap-2">
                  {s.yearly.map((v, i) => (
                    <div key={i} className="flex-1 text-center">
                      <div
                        className="rounded-md transition-all"
                        style={{
                          height: `${12 + (v / 120) * 52}px`,
                          background: hoverYear === i ? s.color : "var(--bv-paper)",
                          border: `1px solid ${hoverYear === i ? s.color : "var(--bv-line)"}`,
                        }}
                      />
                      <p className="mt-1.5 text-[10px]" style={{ color: "var(--bv-ink-faint)" }}>
                        Y{i + 1}
                      </p>
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        <BookInsightsChat />
      </main>
    </div>
  );
}

function Stat({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      className="flex items-center justify-between py-3 text-sm"
      style={{ borderTop: "1px solid rgba(255,255,255,0.14)", borderBottom: last ? "none" : undefined }}
    >
      <span className="opacity-70">{label}</span>
      <span className="font-mono font-semibold">{value}</span>
    </div>
  );
}
