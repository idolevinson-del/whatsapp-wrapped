/** Anonymous funnel events. Never include chat content, names, or message text. */
export type AnalyticsEvent =
  | 'file_uploaded'
  | 'results_viewed'
  | 'card_shared'
  | 'results_shared'
  | 'checkout_started'
  | 'premium_unlocked';

export interface AnalyticsProvider {
  init(): void;
  trackPageView(): void;
  trackEvent(event: AnalyticsEvent): void;
}
