import { useEffect, useRef, useState, type ReactNode, type TouchEvent } from 'react';

const SWIPE_THRESHOLD_PX = 50;

interface StoryViewerProps {
  children: ReactNode[];
}

export function StoryViewer({ children }: StoryViewerProps) {
  const [index, setIndex] = useState(0);
  const total = children.length;
  const touchStartX = useRef<number | null>(null);

  function goTo(next: number) {
    setIndex(Math.max(0, Math.min(total - 1, next)));
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'ArrowRight') goTo(index + 1);
      else if (event.key === 'ArrowLeft') goTo(index - 1);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, total]);

  function handleTouchStart(event: TouchEvent) {
    touchStartX.current = event.touches[0].clientX;
  }

  function handleTouchEnd(event: TouchEvent) {
    if (touchStartX.current === null) return;
    const deltaX = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;

    if (deltaX > SWIPE_THRESHOLD_PX) goTo(index - 1);
    else if (deltaX < -SWIPE_THRESHOLD_PX) goTo(index + 1);
  }

  return (
    <div
      className="relative h-screen w-full overflow-hidden bg-black"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="absolute inset-x-0 top-0 z-20 flex gap-1 p-3">
        {children.map((_, i) => (
          <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
            <div className={`h-full bg-white transition-all ${i <= index ? 'w-full' : 'w-0'}`} />
          </div>
        ))}
      </div>

      <div className="h-full w-full">
        {children[index]}
      </div>

      {index > 0 && (
        <button
          type="button"
          aria-label="Previous"
          onClick={() => goTo(index - 1)}
          className="absolute inset-y-0 start-0 z-10 w-1/4 cursor-pointer"
        />
      )}
      {index < total - 1 && (
        <button
          type="button"
          aria-label="Next"
          onClick={() => goTo(index + 1)}
          className="absolute inset-y-0 end-0 z-10 w-1/4 cursor-pointer"
        />
      )}
    </div>
  );
}
