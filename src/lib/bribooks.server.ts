import { AUTHOR, BOOK_BASES, normalizeTitle } from "./book-data";

type ApiBook = { name?: string; author_name?: string; views?: string | number };

/** Reads the eye-icon view count for each of the author's books from BriBooks search. */
export async function fetchLiveViews() {
  const out: Record<string, number> = {};
  for (const book of BOOK_BASES) {
    const res = await fetch("https://api.bribooks.com/api/getBooks", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-locale": "in",
        referer: "https://www.bribooks.com/",
      },
      body: JSON.stringify({ page: 1, genre_id: 0, search: book.search, timezone: 0, version: "7.0.4", locale: "in" }),
    });
    if (!res.ok) throw new Error(`BriBooks search failed (${res.status})`);
    const json = (await res.json()) as { data?: { books?: ApiBook[] } };
    const books = json.data?.books ?? [];
    const key = normalizeTitle(book.search).slice(0, 6); // "thefox" / "raosex"
    const match = books.find(
      (b) =>
        (b.author_name ?? "").trim().toLowerCase() === AUTHOR.toLowerCase() &&
        normalizeTitle(b.name ?? "").startsWith(key),
    );
    const views = Number(match?.views);
    if (match && Number.isFinite(views) && views >= 0) out[book.id] = views;
  }
  return out;
}
