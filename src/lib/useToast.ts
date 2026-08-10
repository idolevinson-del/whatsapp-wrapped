import { useEffect, useRef, useState } from 'react';

const TOAST_DURATION_MS = 4000;

/**
 * A toast that survives the tab being backgrounded — critical for the
 * "share to WhatsApp" flow: wa.me deep-links straight into the WhatsApp app
 * on mobile, backgrounding this tab the instant window.open() runs. A plain
 * setTimeout keeps counting down while hidden and usually expires before
 * the visitor ever switches back, so the confirmation is silently gone by
 * the time they'd actually see it — exactly the "did that even work?"
 * report a share confirmation exists to prevent.
 *
 * Fix: pause the countdown while the tab is hidden, and give a full fresh
 * TOAST_DURATION_MS once it becomes visible again.
 */
export function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearTimer() {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function armDismiss() {
    clearTimer();
    timerRef.current = setTimeout(() => setMessage(null), TOAST_DURATION_MS);
  }

  function show(text: string) {
    setMessage(text);
    if (document.visibilityState === 'visible') {
      armDismiss();
    }
    // else: intentionally left un-armed — the effect below arms a fresh
    // timer once the tab is actually visible again.
  }

  useEffect(() => {
    if (message === null) return;
    function handleVisibility() {
      if (document.visibilityState === 'hidden') {
        clearTimer(); // pause the countdown while backgrounded
      } else {
        armDismiss(); // full fresh window once the visitor is back
      }
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);

  useEffect(() => clearTimer, []); // clear any pending timer on unmount

  return { message, show };
}
