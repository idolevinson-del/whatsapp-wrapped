import type { AnalyticsProvider } from './types';

/** Used when no analytics provider is configured — does nothing. */
export const noopProvider: AnalyticsProvider = {
  init() {},
  trackPageView() {},
  trackEvent() {},
};
