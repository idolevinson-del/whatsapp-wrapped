import { useEffect, useLayoutEffect, useRef, useState } from 'react';

/** Matches the popover's Tailwind width class (w-64) — used to clamp its
 * position so it never overflows a narrow viewport. */
const POPOVER_WIDTH_PX = 256;
const VIEWPORT_MARGIN_PX = 12;

/**
 * A small "ⓘ" button next to a stat's title that reveals a plain-language
 * explanation of how that number is actually calculated (e.g. what counts
 * as "starting a conversation") — on tap/click, not hover, since this is a
 * mobile-first app. Closes on an outside tap or a second tap on the icon.
 *
 * Positioned with `fixed` + a measured, viewport-clamped offset rather than
 * `absolute start-0` off the tiny icon: the icon can sit anywhere on the
 * title (name lengths vary, RTL flips which edge is "near"), so anchoring
 * naively would let the popover run off-screen on narrow phones.
 */
export function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const maxLeft = Math.max(VIEWPORT_MARGIN_PX, window.innerWidth - POPOVER_WIDTH_PX - VIEWPORT_MARGIN_PX);
    const left = Math.min(Math.max(rect.left, VIEWPORT_MARGIN_PX), maxLeft);
    setPosition({ top: rect.bottom + 8, left });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleOutside(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [open]);

  return (
    <span ref={containerRef} className="relative inline-block align-middle">
      <button
        ref={buttonRef}
        type="button"
        aria-label="What does this mean?"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((o) => !o);
        }}
        className="ms-1.5 inline-flex h-4 w-4 cursor-pointer items-center justify-center rounded-full border border-white/30 text-[10px] font-semibold text-white/60 hover:border-white/60 hover:text-white/90"
      >
        i
      </button>
      {open && position && (
        <div
          role="tooltip"
          onClick={(event) => event.stopPropagation()}
          style={{ top: position.top, left: position.left }}
          className="fixed z-20 w-64 max-w-[80vw] rounded-lg border border-white/15 bg-neutral-900 p-3 text-start text-xs font-normal normal-case leading-relaxed tracking-normal text-neutral-300 shadow-xl"
        >
          {text}
        </div>
      )}
    </span>
  );
}
