import type { HeadlineCardData } from '../../pages/buildStoryCards';

export function HeadlineCard({ text }: Omit<HeadlineCardData, 'kind'>) {
  return (
    <div
      style={{ background: 'linear-gradient(to bottom right, #f59e0b, #f43f5e, #9333ea)' }}
      className="flex h-screen w-full flex-col items-center justify-center p-8 text-center text-white"
    >
      <span className="text-6xl">💬</span>
      <p className="mt-6 max-w-md text-2xl font-extrabold leading-snug sm:text-3xl">{text}</p>
    </div>
  );
}
