import { noopProvider } from './noopProvider';
import { createPlausibleProvider } from './plausibleProvider';
import type { AnalyticsEvent, AnalyticsProvider } from './types';

/**
 * Swappable analytics: set VITE_PLAUSIBLE_DOMAIN to enable Plausible.
 * With no domain configured, analytics is a no-op — nothing is sent.
 * To switch providers, only this file needs to change.
 */
const domain: string | undefined = import.meta.env.VITE_PLAUSIBLE_DOMAIN;

const provider: AnalyticsProvider = domain ? createPlausibleProvider(domain) : noopProvider;

export function initAnalytics(): void {
  provider.init();
}

export function trackPageView(): void {
  provider.trackPageView();
}

export function trackEvent(event: AnalyticsEvent): void {
  provider.trackEvent(event);
}

export type { AnalyticsEvent };
