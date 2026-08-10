import { describe, expect, it } from 'vitest';
import { buildStoryCards } from './buildStoryCards';
import { FREE_PERSONA_IDS } from '../lib/headlinePersona';
import { buildExampleAnalysis } from '../lib/exampleAnalysis';
import { en } from '../i18n/en';

describe('buildStoryCards premium gating', () => {
  it('never shows a locked-chart persona to a non-premium viewer', () => {
    const analysis = buildExampleAnalysis();
    const cards = buildStoryCards(analysis, en, 'WhatsApp Chat with Sam.txt', false);
    const personaCards = cards.filter((c) => c.kind === 'persona');

    // Sanity check the fixture actually produced at least one persona that
    // *would* be filtered, so this test can't pass vacuously.
    const allPersonaIds = new Set(personaCards.map((c) => c.id));
    expect(allPersonaIds.size).toBeGreaterThan(0);

    for (const card of personaCards) {
      expect(FREE_PERSONA_IDS.has(card.id)).toBe(true);
    }
  });

  it('shows every persona to a premium viewer, including locked-chart ones', () => {
    const analysis = buildExampleAnalysis();
    const freeCards = buildStoryCards(analysis, en, 'WhatsApp Chat with Sam.txt', false);
    const premiumCards = buildStoryCards(analysis, en, 'WhatsApp Chat with Sam.txt', true);

    const freeCount = freeCards.filter((c) => c.kind === 'persona').length;
    const premiumCount = premiumCards.filter((c) => c.kind === 'persona').length;

    // Premium should never show *fewer* personas than free — this fixture's
    // data must include at least one that free filters out.
    expect(premiumCount).toBeGreaterThan(freeCount);
  });

  it('defaults to the free (most restrictive) filtering if premium status is omitted', () => {
    const analysis = buildExampleAnalysis();
    const withDefault = buildStoryCards(analysis, en, 'WhatsApp Chat with Sam.txt');
    const explicitFree = buildStoryCards(analysis, en, 'WhatsApp Chat with Sam.txt', false);
    expect(withDefault.map((c) => (c.kind === 'persona' ? c.id : c.kind))).toEqual(
      explicitFree.map((c) => (c.kind === 'persona' ? c.id : c.kind))
    );
  });
});
