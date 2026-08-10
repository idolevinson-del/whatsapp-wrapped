/**
 * Sits over a locked stat's data area only — never its title, so a free
 * visitor can always see *what* the stat is, just not the numbers behind it.
 * Expects a `relative` ancestor to anchor to.
 *
 * Deliberately near-opaque, not just semi-transparent: a translucent overlay
 * over a merely-blurred chart still lets colors/shapes bleed through enough
 * to eyeball relative sizes (which sender's bar is longer, etc). This is a
 * second, independent layer on top of the CSS blur underneath — either one
 * failing shouldn't leak the data.
 */
export function LockedOverlay({ onOpenPremium, label }: { onOpenPremium: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onOpenPremium}
      className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl bg-neutral-950/95 backdrop-blur-md transition-colors hover:bg-neutral-950"
    >
      <span className="text-2xl">🔒</span>
      <span className="text-xs font-semibold text-amber-300 underline-offset-2">{label}</span>
    </button>
  );
}
