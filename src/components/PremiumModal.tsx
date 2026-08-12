import { useState } from 'react';
import { useLanguage } from '../i18n';
import { activateLicense, deactivatePremium, isPremium } from '../lib/premium';
import { CHECKOUT_URL } from '../config/premiumConfig';
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

            <a
              href={CHECKOUT_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('checkout_started')}
              className="mt-5 block cursor-pointer rounded-full bg-gradient-to-r from-amber-400 via-rose-400 to-purple-400 px-4 py-2.5 text-center text-sm font-semibold text-neutral-950 hover:opacity-90"
            >
              {dictionary.premium.buyButton}
            </a>

            <div className="mt-5 border-t border-white/10 pt-4">
              <label htmlFor="license-key" className="text-xs font-medium text-neutral-400">
                {dictionary.premium.licenseLabel}
              </label>
              <div className="mt-2 flex gap-2">
                <input
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
