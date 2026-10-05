import { createServerFn } from "@tanstack/react-start";

// GA4 measurement IDs are public by design (they appear in every page's tag);
// the stored project setting is read server-side and handed to the browser.
export const getAnalyticsId = createServerFn({ method: "GET" }).handler(async () => {
  const id = (process.env["GOOGLE_ANALYTICS_MEASUREMENT_ID"] ?? "").trim();
  return { id: /^G-[A-Z0-9]+$/i.test(id) ? id : null };
});
