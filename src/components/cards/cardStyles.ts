import type { PersonaId } from '../../i18n';

export const HEADLINE_GRADIENT = 'from-amber-500 via-rose-500 to-purple-600';
export const OUTRO_GRADIENT = 'from-emerald-500 via-teal-500 to-cyan-600';
export const DEFAULT_PERSONA_GRADIENT = 'from-slate-700 via-slate-800 to-slate-900';

export const PERSONA_GRADIENTS: Record<PersonaId, string> = {
  nightOwl: 'from-indigo-900 via-purple-800 to-slate-900',
  earlyBird: 'from-orange-400 via-amber-400 to-yellow-300',
  fastestReplier: 'from-cyan-500 via-blue-500 to-indigo-600',
  philosopher: 'from-emerald-600 via-teal-600 to-cyan-700',
  conversationStarter: 'from-pink-500 via-rose-500 to-red-500',
  streaker: 'from-orange-600 via-red-600 to-rose-700',
  emojiEnthusiast: 'from-yellow-400 via-pink-400 to-purple-500',
  chatterbox: 'from-violet-500 via-purple-600 to-fuchsia-600',
  comedian: 'from-yellow-400 via-orange-400 to-pink-500',
  ghost: 'from-slate-500 via-gray-600 to-zinc-700',
  mostMentioned: 'from-amber-300 via-yellow-400 to-orange-400',
};

export const PERSONA_ICONS: Record<PersonaId, string> = {
  nightOwl: '🦉',
  earlyBird: '🌅',
  fastestReplier: '⚡',
  philosopher: '📖',
  conversationStarter: '💬',
  streaker: '🔥',
  emojiEnthusiast: '😄',
  chatterbox: '🗣️',
  comedian: '😂',
  ghost: '👻',
  mostMentioned: '🌟',
};

export const BUSIEST_DAY_GRADIENT = 'from-blue-500 via-indigo-500 to-violet-600';

export function isPersonaId(id: string): id is PersonaId {
  return id in PERSONA_GRADIENTS;
}
