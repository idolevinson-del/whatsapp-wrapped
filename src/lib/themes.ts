/**
 * Premium color themes for the results page and shareable image. Free users
 * always get `DEFAULT_THEME` (the app's own brand colors, unchanged) —
 * picking a different one requires `isPremium()`.
 */
export interface Theme {
  id: string;
  label: string;
  /** Tailwind `from-...via-...to-...` classes, for the title text and CTA button. */
  gradientClasses: string;
  /** The same three stops as hex, for the canvas-rendered share image. */
  hexStops: [string, string, string];
}

export const THEMES: Theme[] = [
  {
    id: 'sunset',
    label: 'Sunset',
    gradientClasses: 'from-amber-400 via-rose-400 to-purple-400',
    hexStops: ['#fbbf24', '#fb7185', '#c084fc'],
  },
  {
    id: 'ocean',
    label: 'Ocean',
    gradientClasses: 'from-cyan-400 via-blue-400 to-indigo-400',
    hexStops: ['#22d3ee', '#60a5fa', '#818cf8'],
  },
  {
    id: 'forest',
    label: 'Forest',
    gradientClasses: 'from-lime-400 via-emerald-400 to-teal-400',
    hexStops: ['#a3e635', '#34d399', '#2dd4bf'],
  },
  {
    id: 'berry',
    label: 'Berry',
    gradientClasses: 'from-pink-400 via-fuchsia-400 to-violet-400',
    hexStops: ['#f472b6', '#e879f9', '#a78bfa'],
  },
];

export const DEFAULT_THEME = THEMES[0];

const STORAGE_KEY = 'whatsapp-wrapped:theme';

export function getSelectedTheme(): Theme {
  try {
    const id = localStorage.getItem(STORAGE_KEY);
    return THEMES.find((t) => t.id === id) ?? DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function setSelectedTheme(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // localStorage unavailable — the choice just won't persist across reloads
  }
}
