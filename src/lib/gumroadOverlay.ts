const SCRIPT_SRC = 'https://gumroad.com/js/gumroad.js';

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
 *
 * Calls `onReady` once the script has actually finished loading (and thus
 * had a chance to bind its click handler to matching anchors) — PremiumModal
 * uses this to keep the Buy button disabled until then, specifically to
 * rule out "tapped Buy before the script was ready, so it just fell
 * through to a normal navigation" as a cause of the overlay not opening.
 */
export function loadGumroadOverlay(onReady: () => void): void {
  if (typeof document === 'undefined') return;

  const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
  if (existing) {
    if (existing.dataset.loaded === 'true') onReady();
    else existing.addEventListener('load', onReady, { once: true });
    return;
  }

  const script = document.createElement('script');
  script.src = SCRIPT_SRC;
  script.async = true;
  script.addEventListener('load', () => {
    script.dataset.loaded = 'true';
    onReady();
  });
  document.body.appendChild(script);
}
