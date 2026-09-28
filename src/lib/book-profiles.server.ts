// Book previews + author bios read from each book's BriBooks page
// (found via the "The Fox and the Cub" / "Rao's Expedition Book" searches).
// Falls back to the last known text if BriBooks is unreachable.

type Profile = { id: string; title: string; slug: string; genre: string; preview: string; authorBio: string };

const FALLBACK: Profile[] = [
  {
    id: "fox",
    title: "The Fox and the Cub",
    slug: "the-fox-and-cub",
    genre: "Forest · climate change",
    preview:
      "A lion and a lioness lived in the great forest with their cub. One day, the lion said to the lioness that he was exhausted from hunting animals. So the lioness said ok, you then take rest. I will take care of our cub and hunt animals. So the lion went to the den and slept. Then the lioness said to the cub I am going to hunt animals. Till then, do not let any stranger come into the cave.",
    authorBio:
      "Shubhang Mishra is eight years old and studies in class 2 of Seth M.R Jaipuria School, Gomti Nagar, Lucknow. Shubhang lives with his parents and grandparents at Gomti Nagar, Lucknow. Shubhang likes playing football and chess. He likes reading books.",
  },
  {
    id: "rao",
    title: "Rao's Expedition Book",
    slug: "rao-s-expedition-book",
    genre: "Space · Science & Technology",
    preview:
      "There are many mysteries of space, not just culture and mythology. So there are some people called expeditors. These people always search for secrets about another culture's mythology and some new things. Rao is a fifth-grade boy who read about expeditions in his sst book. He liked the topic very much.",
    authorBio:
      "Shubhang Mishra is studying in Seth MR Jaipuria at Gomti Nagar, Lucknow. Shubhang has a lot of interest in reading and discussing the celestial bodies. Shubhang likes writing stories about animals, planets, forests etc.",
  },
];

let cache: { at: number; data: Profile[] } | null = null;

async function fetchOne(p: Profile): Promise<Profile> {
  try {
    const res = await fetch(`https://www.bribooks.com/bookstore/${p.slug}`, { signal: AbortSignal.timeout(6000) });
    const html = await res.text();
    const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!m?.[1]) return p;
    const props = JSON.parse(m[1])?.props?.pageProps;
    const preview = String(props?.page?.texts?.[0] ?? "").trim();
    const bio = String(props?.book?.author_bio ?? "").trim();
    return { ...p, preview: preview || p.preview, authorBio: bio || p.authorBio };
  } catch {
    return p;
  }
}

export async function getBookProfiles(): Promise<Profile[]> {
  if (cache && Date.now() - cache.at < 6 * 3600 * 1000) return cache.data;
  const data = await Promise.all(FALLBACK.map(fetchOne));
  cache = { at: Date.now(), data };
  return data;
}

export function profilesToPrompt(list: Profile[]): string {
  return list
    .map(
      (p) =>
        `### ${p.title} (${p.genre})\nOpening preview: "${p.preview}"\nAuthor intro (from this book's page): "${p.authorBio}"`,
    )
    .join("\n\n");
}
