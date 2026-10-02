import { createFileRoute } from "@tanstack/react-router";

import { AchievementCarousel } from "@/components/AchievementCarousel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Shubhang Mishra | Young Author & Achievement Portfolio" },
      {
        name: "description",
        content:
          "Explore young author Shubhang Mishra’s achievements in writing, spelling and music, and discover his children’s stories The Fox and the Cub and Rao’s Expedition Book.",
      },
      { property: "og:title", content: "Shubhang Mishra | Young Author & Achievement Portfolio" },
      {
        property: "og:description",
        content:
          "Explore young author Shubhang Mishra’s achievements and his two books: The Fox and the Cub and Rao’s Expedition Book.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <AchievementCarousel />;
}
