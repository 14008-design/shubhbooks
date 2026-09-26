import { createFileRoute } from "@tanstack/react-router";

import { AchievementCarousel } from "@/components/AchievementCarousel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Achievement Gallery — Shubhang Mishra" },
      {
        name: "description",
        content:
          "An interactive gallery of academic achievements — spelling bees, creative writing, publication and music.",
      },
      { property: "og:title", content: "Achievement Gallery — Shubhang Mishra" },
      {
        property: "og:description",
        content:
          "An interactive gallery of academic achievements — spelling bees, creative writing, publication and music.",
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
