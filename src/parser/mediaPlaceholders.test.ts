import { describe, expect, it } from 'vitest';
import { isMediaPlaceholder, isVoiceMessagePlaceholder } from './mediaPlaceholders';

describe('isVoiceMessagePlaceholder', () => {
  it('recognizes the English and Hebrew voice-message placeholders', () => {
    expect(isVoiceMessagePlaceholder('audio omitted')).toBe(true);
    expect(isVoiceMessagePlaceholder('Audio omitted')).toBe(true); // case-insensitive
    expect(isVoiceMessagePlaceholder('ההודעה הקולית הושמטה')).toBe(true);
  });

  it('does not match other media placeholders', () => {
    expect(isVoiceMessagePlaceholder('image omitted')).toBe(false);
    expect(isVoiceMessagePlaceholder('video omitted')).toBe(false);
    expect(isVoiceMessagePlaceholder('<Media omitted>')).toBe(false);
  });

  it('does not match ordinary text', () => {
    expect(isVoiceMessagePlaceholder('call me later')).toBe(false);
  });

  it('every voice-message placeholder is still a media placeholder', () => {
    // isVoiceMessagePlaceholder is meant to be a subset check, not a
    // parallel/independent classification.
    expect(isMediaPlaceholder('audio omitted')).toBe(true);
    expect(isMediaPlaceholder('ההודעה הקולית הושמטה')).toBe(true);
  });
});
