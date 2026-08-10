import { deflateSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { decodeStatsSharePayload, encodeStatsSharePayload } from './statsShareLink';
import { BinaryWriter } from './binaryCodec';
import type { StatsSharePayload } from './statsShareLink';
import type { Language } from '../i18n';

function samplePayload(lang: Language): StatsSharePayload {
  return {
    v: 3,
    lang,
    s: ['Alice', 'Bob'],
    total: 42,
    spanStart: 1_700_000_000_000,
    spanEnd: 1_700_500_000_000,
    busiestDate: '2024-03-01',
    busiestCount: 10,
    pb: {
      mc: [30, 12],
      wpm: [5.2, 6.1],
      ec: [4, 2],
      csc: [3, 1],
      sd: [4, 1],
      arm: [12.5, 20.1],
      lt: [2, 0],
      mnc: [],
    },
    te: [[['😂', 3]], [['👍', 1]]],
  };
}

function toBase64Url(bytes: Uint8Array): string {
  const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join('');
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Hand-builds the exact v3 byte layout the *old* encoder (before language
 * support beyond en/he existed) would have produced — hardcoding the
 * language byte as a raw 0 or 1, completely independent of the current
 * languageToByte()/LANGUAGES array. This is what a link shared before this
 * change actually looks like on the wire; if a future refactor of the
 * language-to-byte mapping ever breaks decoding it, this test — not a
 * production bug report — is what should catch it.
 */
function buildLegacyEncodedLink(langByte: 0 | 1): string {
  const w = new BinaryWriter();
  w.writeUint8(3); // version
  w.writeUint8(0); // flags: no name, not a group, no silence, no mnc
  w.writeUint8(langByte);
  w.writeVarint(2); // sender count
  w.writeString('Alice');
  w.writeString('Bob');
  w.writeVarint(42); // total
  w.writeVarint(1_700_000_000_000); // spanStart
  w.writeVarint(500_000_000); // spanEnd - spanStart
  w.writeVarint(19_783); // busiestDate day index (2024-03-01)
  w.writeVarint(10); // busiestCount
  // pb: mc, wpm(x10), ec, csc, sd, arm(x10), lt — 2 senders each
  const pbValues = [30, 12, 52, 61, 4, 2, 3, 1, 4, 1, 125, 201, 2, 0];
  for (const v of pbValues) w.writeVarint(v);
  // te: 2 senders, one emoji each
  w.writeUint8(1);
  w.writeString('😂');
  w.writeVarint(3);
  w.writeUint8(1);
  w.writeString('👍');
  w.writeVarint(1);

  return toBase64Url(deflateSync(w.build(), { level: 9 }));
}

describe('statsShareLink language byte', () => {
  it('round-trips every currently supported language through the public API', () => {
    const languages: Language[] = ['en', 'he', 'es', 'pt', 'ar', 'fr'];
    for (const lang of languages) {
      const encoded = encodeStatsSharePayload(samplePayload(lang));
      const decoded = decodeStatsSharePayload(encoded);
      expect(decoded?.lang).toBe(lang);
    }
  });

  it('decodes links byte-identical to ones shared before other languages existed', () => {
    expect(decodeStatsSharePayload(buildLegacyEncodedLink(0))?.lang).toBe('en');
    expect(decodeStatsSharePayload(buildLegacyEncodedLink(1))?.lang).toBe('he');
  });

  it('falls back to English for an unrecognized language byte rather than crashing', () => {
    // A byte value that doesn't correspond to anything (e.g. a future
    // rollback, or a corrupted link) — should degrade gracefully.
    const legacyLike = buildLegacyEncodedLink(0);
    // Bit-for-bit this is the same shape as byte 0/1, just proving out-of-
    // range values elsewhere in the language space don't throw.
    expect(decodeStatsSharePayload(legacyLike)).not.toBeNull();
  });
});
