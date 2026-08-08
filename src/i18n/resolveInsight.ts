import type { Dictionary, PersonaId } from './types';

const PERSONA_PREFIX = 'persona.';

/**
 * Resolves an `insightTemplate` id produced by the analysis layer (e.g.
 * 'persona.nightOwl') to the matching translated template string, ready
 * for `formatTemplate`.
 */
export function resolveInsightTemplate(insightTemplate: string, dictionary: Dictionary): string | undefined {
  if (insightTemplate.startsWith(PERSONA_PREFIX)) {
    const id = insightTemplate.slice(PERSONA_PREFIX.length) as PersonaId;
    return dictionary.personas[id];
  }

  return undefined;
}
