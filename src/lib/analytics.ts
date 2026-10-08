// Google Analytics 4. The measurement ID comes from the project's
// GOOGLE_ANALYTICS_MEASUREMENT_ID setting via a server function.
import { getAnalyticsId } from "./analytics-config.functions";

type GtagFn = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: GtagFn;
  }
}

let initialized = false;
export async function initAnalytics() {
  if (initialized) return;
  if (typeof window === "undefined") return;
  initialized = true;

  let measurementId: string | null = null;
  try {
    measurementId = (await getAnalyticsId()).id;
  } catch {
    return;
  }
  if (!measurementId) return;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  const gtag: GtagFn = function gtag() {
    window.dataLayer!.push(arguments);
  };
  window.gtag = gtag;
  gtag("js", new Date());

  // 🚀 ADVANCED ANALYTICS: Detect if the site is running inside an embed (iframe)
  const isIframe = window.self !== window.top;
  
  gtag("config", measurementId, {
    custom_traffic_source: isIframe ? "iframe_embed" : "direct_or_organic"
  });

  // Push a special event if someone views your site through an embed!
  if (isIframe) {
    gtag("event", "iframe_view", {
      event_category: "Embeds",
      event_label: document.referrer || "Unknown Embed Source"
    });
  }
}

export function trackPageView(path: string) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", "page_view", { page_path: path, page_location: window.location.href });
}

export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", name, params);
}
