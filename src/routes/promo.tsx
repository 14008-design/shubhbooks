import { createFileRoute } from "@tanstack/react-router";

import PromoScreen from "@/components/PromoScreen";

const title = "The Fox and the Cub — Read the Story, Watch It Grow | Shubhang Mishra";
const description =
  "Scan to explore The Fox and the Cub by young author Shubhang Mishra: live reader stats, an AI that answers questions about the story, and the official BriBooks listing.";

export const Route = createFileRoute("/promo")({
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
  component: PromoScreen,
});
