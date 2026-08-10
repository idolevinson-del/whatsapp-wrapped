/**
 * A brief, fixed-position confirmation banner (e.g. "thanks for sharing!").
 * Purely presentational — the caller owns the timer that clears the message
 * and unmounts this, same pattern as the rest of this app's transient UI.
 */
export function Toast({ message }: { message: string }) {
  return (
    <div className="fixed inset-x-4 bottom-6 z-50 flex justify-center">
      <div className="rounded-full bg-neutral-900 px-5 py-3 text-center text-sm font-semibold text-white shadow-xl ring-1 ring-white/15">
        {message}
      </div>
    </div>
  );
}
