/**
 * Sits over a locked stat's data area only — never its title, so a free
 * visitor can always see *what* the stat is, just not the numbers behind it.
 * Expects a `relative` ancestor to anchor to.
 */
export function LockedOverlay({ onOpenPremium, label }: { onOpenPremium: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onOpenPremium}
      className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl bg-black/55 backdrop-blur-[1px] transition-colors hover:bg-black/65"
    >
      <span className="text-2xl">🔒</span>
      <span className="text-xs font-semibold text-amber-300 underline-offset-2">{label}</span>
    </button>
  );
}
