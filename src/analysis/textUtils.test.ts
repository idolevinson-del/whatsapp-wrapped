import { describe, expect, it } from 'vitest';
import { countCurseWords } from './textUtils';

describe('countCurseWords', () => {
  it('counts real curse words, case-insensitively', () => {
    expect(countCurseWords('this is fucking ridiculous')).toBe(1);
    expect(countCurseWords('FUCK this shit')).toBe(2);
  });

  it('counts every occurrence, not just distinct words', () => {
    expect(countCurseWords('fuck fuck fuck')).toBe(3);
  });

  it('does not count ordinary words that merely contain a curse word as a substring', () => {
    // "assassin" contains "ass" but is not itself a curse word, and word-
    // boundary tokenization should never split it into pieces.
    expect(countCurseWords('the assassin crept in')).toBe(0);
  });

  it('returns 0 for clean text', () => {
    expect(countCurseWords('have a wonderful day!')).toBe(0);
  });

  it('recognizes Hebrew curse words', () => {
    expect(countCurseWords('אתה כזה חרא, לך תזדיין')).toBe(2);
  });

  it('ignores media placeholder text (no curse words in it)', () => {
    expect(countCurseWords('<Media omitted>')).toBe(0);
  });
});
