import { createFileRoute } from "@tanstack/react-router";

import BookViewsDashboard from "@/components/BookViewsDashboard";

const title = "The Fox and the Cub & Rao’s Expedition Book | Shubhang Mishra";
const description =
  "Discover Shubhang Mishra’s children’s forest story and expedition book. Explore live BriBooks view counts, preview the stories and find each book’s official listing.";

export const Route = createFileRoute("/book-views")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BookViewsDashboard,
});
