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
  // gtag.js requires the classic `arguments` object pushed into dataLayer;
  // pushing a rest array makes Google silently drop every event.
  const gtag: GtagFn = function gtag() {
    // eslint-disable-next-line prefer-rest-params -- gtag.js needs the Arguments object
    window.dataLayer!.push(arguments);
  };
  window.gtag = gtag;

  gtag("js", new Date());
  gtag("config", measurementId);
}

export function trackPageView(path: string) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", "page_view", { page_path: path, page_location: window.location.href });
}

export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", name, params);
}
