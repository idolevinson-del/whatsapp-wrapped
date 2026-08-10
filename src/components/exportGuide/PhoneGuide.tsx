import { useEffect, useRef, useState } from 'react';
import { GuideStepView } from './screens';
import type { GuideStep } from './types';

const AUTO_MS = 3600;

interface PhoneGuideProps {
  steps: GuideStep[];
  captions: string[];
  contactName: string;
  contactSub: string;
  messages: { text: string; time: string; out?: boolean }[];
}

/**
 * The illustrated, auto-advancing phone mockup for the export guide. Same
 * tap-to-navigate interaction language as the app's own StoryViewer (tap
 * zones on each side, a segmented progress bar, dots) so it feels native to
 * the app rather than bolted on.
 *
 * Step index lives in this component's own state and doesn't react to a
 * `steps` prop change — the caller must remount it (e.g. `key={platform}`)
 * when swapping in a different step set, so it always starts a fresh set
 * of steps from step one.
 */
export function PhoneGuide({ steps, captions, contactName, contactSub, messages }: PhoneGuideProps) {
  const [index, setIndex] = useState(0);
  const total = steps.length;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function clampIndex(n: number) {
    return ((n % total) + total) % total;
  }

  function restartAuto() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setIndex((i) => clampIndex(i + 1)), AUTO_MS);
  }

  useEffect(() => {
    restartAuto();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function userGoTo(n: number) {
    setIndex(clampIndex(n));
    restartAuto();
  }

  const step = steps[index];

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="relative h-[560px] w-[264px] overflow-hidden rounded-[34px] border border-white/10"
        style={{ boxShadow: '0 30px 60px -20px rgba(0,0,0,0.7), 0 0 0 6px #1a1a1e' }}
        onMouseEnter={() => timerRef.current && clearInterval(timerRef.current)}
        onMouseLeave={restartAuto}
      >
        <div className="absolute left-1/2 top-0 z-30 h-5 w-[90px] -translate-x-1/2 rounded-b-2xl bg-black" />

        <div className="absolute inset-x-2.5 top-6 z-20 flex gap-1">
          {steps.map((_, i) => (
            <i key={i} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/25">
              <b
                className="block h-full rounded-full bg-white"
                style={{
                  width: i < index ? '100%' : '0%',
                  animation: i === index ? `fillbar ${AUTO_MS}ms linear forwards` : undefined,
                }}
              />
            </i>
          ))}
        </div>

        <div className="absolute inset-0">
          <GuideStepView step={step} ctx={{ contactName, contactSub, messages }} />
        </div>

        {/* Tap-zone sides and chevron glyphs below were swapped relative to
         * their actions (tapping the "forward" side went backward, and vice
         * versa) — start/end here matches StoryViewer's convention: tap the
         * end side (right in LTR, left in RTL) to advance. */}
        <button
          type="button"
          aria-label="Previous"
          onClick={() => userGoTo(index - 1)}
          className="absolute inset-y-0 start-0 z-10 w-[30%] cursor-pointer"
        />
        <button
          type="button"
          aria-label="Next"
          onClick={() => userGoTo(index + 1)}
          className="absolute inset-y-0 end-0 z-10 w-[30%] cursor-pointer"
        />
      </div>

      <p className="min-h-[42px] max-w-[300px] text-center text-[14.5px] font-semibold leading-relaxed text-white">
        {captions[index]}
      </p>

      <div className="flex items-center gap-3.5">
        <button
          type="button"
          onClick={() => userGoTo(index - 1)}
          aria-label="Previous step"
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-white/5 text-sm hover:bg-white/10"
        >
          ‹
        </button>
        <div className="flex max-w-[220px] flex-wrap justify-center gap-1.5">
          {steps.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Step ${i + 1}`}
              onClick={() => userGoTo(i)}
              className={`h-1.5 w-1.5 rounded-full transition-transform ${
                i === index ? 'scale-125 bg-gradient-to-r from-amber-400 to-rose-400' : 'bg-white/15'
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => userGoTo(index + 1)}
          aria-label="Next step"
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-white/5 text-sm hover:bg-white/10"
        >
          ›
        </button>
      </div>
    </div>
  );
}
