import { createFileRoute } from "@tanstack/react-router";

import BookViewsDashboard from "@/components/BookViewsDashboard";

const title = "Book Views — Analytics Desk";
const description =
  "A clear view of book readership across every year of a title's journey. Cumulative views for The Fox and the Cub and Rao's Expedition Book.";

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
