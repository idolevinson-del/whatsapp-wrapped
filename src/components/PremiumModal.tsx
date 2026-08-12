import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../i18n';
import { activateLicense, deactivatePremium, isPremium } from '../lib/premium';
import { CHECKOUT_URL } from '../config/premiumConfig';
import { loadGumroadOverlay } from '../lib/gumroadOverlay';
import { trackEvent } from '../analytics';

interface PremiumModalProps {
  onClose: () => void;
  /** Called after a successful activation or deactivation, since premium
   * state lives outside React state (localStorage) and the caller needs to
   * re-render with the new value. */
  onPremiumChange: () => void;
  /** Optional context shown above the pitch — e.g. why the modal opened
   * ("you hit the free history limit"), instead of the generic entry point. */
  reason?: string;
}

/**
 * The whole "Wrapped+" surface in one modal: pitch + purchase link + license
 * activation when locked, active status + deactivate when unlocked. No
 * account system — the license key itself is the credential, validated
 * directly against Gumroad from the browser.
 */
export function PremiumModal({ onClose, onPremiumChange, reason }: PremiumModalProps) {
  const { dictionary } = useLanguage();
  const [premium, setPremiumFlag] = useState(isPremium());
  const [licenseInput, setLicenseInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'error'>('idle');
  // Buy stays disabled (with a "loading" label) until this flips true, so
  // there's no window where someone can tap Buy before gumroad.js has
  // actually bound its overlay-checkout click handler — clicking during
  // that gap was falling straight through to the ordinary href navigation,
  // which is exactly the "opens a new tab instead of an overlay" bug this
  // was meant to fix. A GIVE_UP_MS timeout still flips it true on its own
  // if the script never loads at all (blocked by a content blocker, etc.)
  // — Buy must never end up permanently stuck disabled; worst case it
  // just falls back to the plain full-page checkout, same as before any
  // of this existed.
  const [overlayReady, setOverlayReady] = useState(false);
  // Set the moment Buy is actually clicked (not just rendered) — covers
  // both "the overlay never opened, so this fell through to a real
  // navigation" and "someone force-opened the checkout link in a new tab
  // themselves" identically, since either way our tab goes hidden and
  // comes back. Left false whenever the overlay genuinely handles the
  // whole purchase in-page — that path never backgrounds this tab at all,
  // so the visibilitychange listener below simply never has anything to do.
  const [checkoutStarted, setCheckoutStarted] = useState(false);
  // True for the one visibilitychange right after a checkout-triggered
  // background/foreground cycle — shows a "check your email" hint and
  // focuses the license field, then clears itself so it doesn't keep
  // re-triggering on every unrelated tab switch afterwards.
  const [justReturnedFromCheckout, setJustReturnedFromCheckout] = useState(false);
  const licenseInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!checkoutStarted || premium) return;

    function handleVisibilityChange() {
      if (document.visibilityState !== 'visible') return;
      setCheckoutStarted(false);
      setJustReturnedFromCheckout(true);
      licenseInputRef.current?.focus();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [checkoutStarted, premium]);

  useEffect(() => {
    // Not premium yet at the moment this modal opened — get the overlay
    // script in place before anyone can even click Buy. No-op (and safe to
    // skip) if they're already premium, since the buy button never renders.
    if (premium) return;

    const GIVE_UP_MS = 3000;
    let settled = false;
    function ready() {
      if (settled) return;
      settled = true;
      setOverlayReady(true);
    }

    loadGumroadOverlay(ready);
    const giveUpTimer = setTimeout(ready, GIVE_UP_MS);
    return () => clearTimeout(giveUpTimer);
    // Deliberately once per modal open, not every time `premium` flips —
    // loadGumroadOverlay() is itself idempotent (checks for an existing
    // script tag), so there's nothing to gain from re-running this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleActivate() {
    if (!licenseInput.trim() || status === 'checking') return;
    setStatus('checking');
    const result = await activateLicense(licenseInput);
    if (result.ok) {
      setPremiumFlag(true);
      setStatus('idle');
      trackEvent('premium_unlocked');
      onPremiumChange();
    } else {
      setStatus('error');
    }
  }

  function handleDeactivate() {
    deactivatePremium();
    setPremiumFlag(false);
    onPremiumChange();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="premium-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-neutral-900 p-6 text-start text-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2
          id="premium-modal-title"
          className="bg-gradient-to-r from-amber-400 via-rose-400 to-purple-400 bg-clip-text text-xl font-extrabold text-transparent"
        >
          {dictionary.premium.modalTitle}
        </h2>

        {premium ? (
          <>
            <p className="mt-2 text-sm font-semibold text-emerald-400">{dictionary.premium.activeTitle}</p>
            <p className="mt-1 text-sm text-neutral-400">{dictionary.premium.activeBody}</p>

            <button
              type="button"
              onClick={handleDeactivate}
              className="mt-6 cursor-pointer text-xs text-neutral-500 underline-offset-2 hover:text-neutral-300 hover:underline"
            >
              {dictionary.premium.deactivateButton}
            </button>
          </>
        ) : (
          <>
            {reason && (
              <p className="mt-2 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm font-medium text-amber-300">
                {reason}
              </p>
            )}
            <p className="mt-2 text-sm text-neutral-400">{dictionary.premium.pitch}</p>

            <ul className="mt-4 space-y-2 text-sm text-neutral-300">
              <li className="flex gap-2">
                <span>🔓</span>
                <span>{dictionary.premium.featureDeeperStats}</span>
              </li>
              <li className="flex gap-2">
                <span>♾️</span>
                <span>{dictionary.premium.featureHistory}</span>
              </li>
            </ul>

            {/* data-gumroad-overlay-checkout: once gumroad.js (loaded
             * above) finishes loading, it intercepts clicks on this link
             * and opens checkout as a modal over the page instead of
             * navigating away — feels far less like "leaving the app to
             * go pay someone" than a full-page redirect. Disabled (with a
             * "loading" label) until overlayReady, specifically so a click
             * can never land in the gap before the script has bound —
             * that gap was exactly what fell through to a plain full-page
             * navigation instead of the overlay. href/target are still the
             * real checkout page, so if the script never loads at all
             * (overlayReady's own timeout gives up after a few seconds),
             * this just becomes a normal working link again — never
             * permanently stuck. */}
            <a
              href={CHECKOUT_URL}
              target="_blank"
              rel="noopener noreferrer"
              data-gumroad-overlay-checkout="true"
              aria-disabled={!overlayReady}
              onClick={(event) => {
                if (!overlayReady) {
                  event.preventDefault();
                  return;
                }
                trackEvent('checkout_started');
                setCheckoutStarted(true);
              }}
              className={`mt-5 block rounded-full bg-gradient-to-r from-amber-400 via-rose-400 to-purple-400 px-4 py-2.5 text-center text-sm font-semibold text-neutral-950 transition-opacity ${
                overlayReady ? 'cursor-pointer hover:opacity-90' : 'cursor-wait opacity-60'
              }`}
            >
              {overlayReady ? dictionary.premium.buyButton : dictionary.premium.buyButtonPreparing}
            </a>

            <div className="mt-5 border-t border-white/10 pt-4">
              <label htmlFor="license-key" className="text-xs font-medium text-neutral-400">
                {dictionary.premium.licenseLabel}
              </label>
              {/* Shown for the one return-to-tab right after a checkout
               * attempt (see the visibilitychange effect above) — the
               * license field is focused at the same moment, so this
               * explains *why* the app just grabbed focus instead of it
               * feeling like a random jump. */}
              {justReturnedFromCheckout && (
                <p className="mt-1 text-xs text-amber-300">{dictionary.premium.checkoutReturnHint}</p>
              )}
              <div className="mt-2 flex gap-2">
                <input
                  ref={licenseInputRef}
                  id="license-key"
                  type="text"
                  value={licenseInput}
                  onChange={(e) => {
                    setLicenseInput(e.target.value);
                    if (status === 'error') setStatus('idle');
                  }}
                  placeholder={dictionary.premium.licensePlaceholder}
                  className="min-w-0 flex-1 rounded-full border border-white/20 bg-white/5 px-3.5 py-2 text-sm outline-none focus:border-white/40"
                />
                <button
                  type="button"
                  onClick={handleActivate}
                  disabled={status === 'checking' || !licenseInput.trim()}
                  className="shrink-0 cursor-pointer rounded-full border border-white/40 px-4 py-2 text-sm font-medium hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {status === 'checking' ? dictionary.premium.activating : dictionary.premium.activateButton}
                </button>
              </div>
              {status === 'error' && <p className="mt-2 text-xs text-red-400">{dictionary.premium.activateError}</p>}
            </div>
          </>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full cursor-pointer rounded-full border border-white/20 px-4 py-2 text-sm font-medium hover:bg-white/10"
        >
          {dictionary.premium.closeButton}
        </button>
      </div>
    </div>
  );
}
