import type { AnalyticsEvent, AnalyticsProvider } from './types';

declare global {
  interface Window {
    plausible?: (event: string) => void;
  }
}

/**
 * Plausible (https://plausible.io) is a cookie-free, privacy-friendly
 * analytics provider — only anonymous page views and named events are sent,
 * never chat content or names.
 */
export function createPlausibleProvider(domain: string): AnalyticsProvider {
  return {
    init() {
      if (typeof document === 'undefined') return;
      if (document.querySelector('script[data-domain]')) return;

      const script = document.createElement('script');
      script.defer = true;
      script.dataset.domain = domain;
      script.src = 'https://plausible.io/js/script.js';
      document.head.appendChild(script);
    },
    trackPageView() {
      if (typeof window === 'undefined') return;
      window.plausible?.('pageview');
    },
    trackEvent(event: AnalyticsEvent) {
      if (typeof window === 'undefined') return;
      window.plausible?.(event);
    },
  };
}
