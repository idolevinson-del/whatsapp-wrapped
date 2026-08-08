import type { ReactNode } from 'react';

interface StoryCardProps {
  /** Tailwind `from-...via-...to-...` gradient classes. */
  gradient: string;
  children: ReactNode;
}

export function StoryCard({ gradient, children }: StoryCardProps) {
  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center bg-gradient-to-br ${gradient} p-8 text-center text-white`}
    >
      {children}
    </div>
  );
}
