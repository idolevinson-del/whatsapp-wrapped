/**
 * Loads Gumroad's overlay-checkout script on demand — turns any `<a>` tag
 * with `data-gumroad-overlay-checkout="true"` into a purchase flow that
 * opens as a modal over the current page, instead of navigating away to a
 * full external checkout page. Purely Gumroad's own hosted JS; no backend
 * or account of ours involved, matching how the rest of premium works.
 *
 * Only called when the Premium modal's buy button is actually about to be
 * shown (see PremiumModal) — no reason to load third-party JS on every
 * page view for a feature most visitors never open.
 */
export function loadGumroadOverlay(): void {
  if (typeof document === 'undefined') return;
  if (document.querySelector('script[src="https://gumroad.com/js/gumroad.js"]')) return;

  const script = document.createElement('script');
  script.src = 'https://gumroad.com/js/gumroad.js';
  script.async = true;
  document.body.appendChild(script);
}
