/**
 * A single "screen" the phone mockup shows for one guide step. Kept as a
 * small data shape (not JSX) so the same renderer works for both platforms
 * and both languages — only the step data differs.
 */
export type GuideStep =
  | { kind: 'chat'; highlight: 'menu' | 'name' }
  | { kind: 'menu'; items: string[]; highlightIndex: number }
  | { kind: 'dialog'; question: string; options: string[]; highlightIndex: number }
  | { kind: 'share'; apps: { icon: string; label: string }[]; highlightIndex: number }
  | { kind: 'appUpload'; title: string; subtitle: string }
  | { kind: 'filePicker'; header: string; files: { icon: string; name: string; sub: string }[]; highlightIndex: number };
