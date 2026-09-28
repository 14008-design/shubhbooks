export const AUTHOR = "Shubhang Mishra";
export const BRIBOOKS_URL = "https://www.bribooks.com/bookstore/";

export type BookBase = {
  id: "fox" | "rao";
  label: string;
  color: string;
  /** Title as searched on BriBooks */
  search: string;
  /** Locked views for completed years (Year 1..N-1) */
  pastYears: number[];
  /** Fallback live total if no snapshot is available yet */
  fallbackTotal: number;
};

export const BOOK_BASES: BookBase[] = [
  {
    id: "fox",
    label: "The Fox and the Cub",
    color: "var(--bv-coral)",
    search: "The Fox and the Cub",
    pastYears: [40, 60, 115],
    fallbackTotal: 322,
  },
  {
    id: "rao",
    label: "Rao's Expedition Book",
    color: "var(--bv-cerulean)",
    search: "Rao's Expedition Book",
    pastYears: [25, 43],
    fallbackTotal: 132,
  },
];

/** Only the current year changes: current = live total − completed years. */
export function yearlyFromTotal(base: BookBase, liveTotal: number) {
  const past = base.pastYears.reduce((a, c) => a + c, 0);
  return [...base.pastYears, Math.max(0, liveTotal - past)];
}

export const normalizeTitle = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
