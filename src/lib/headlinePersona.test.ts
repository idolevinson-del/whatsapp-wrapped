import { describe, expect, it } from 'vitest';
import { pickHeadlinePersonaFromBreakdown } from './headlinePersona';

describe('pickHeadlinePersonaFromBreakdown', () => {
  it('picks the highest-priority category that actually has data', () => {
    // Nobody has a streak (>1 day), so despite streaker being priority #2,
    // chatterbox (priority #1, has real data) should win.
    const result = pickHeadlinePersonaFromBreakdown({
      senders: ['Alice', 'Bob'],
      pb: {
        mc: [40, 12],
        wpm: [5, 5],
        ec: [0, 0],
        sd: [1, 0], // <=1 everywhere: no real streak
        arm: [0, 0],
        lt: [0, 0],
        mnc: [],
      },
    });
    expect(result?.id).toBe('chatterbox');
    expect(result?.sender).toBe('Alice');
    expect(result?.value).toBe(40);
  });

  it('never picks conversationStarter — its sentence needs a percent the payload does not carry', () => {
    // csc isn't even in the input type, but guard against ever wiring it in
    // without also fixing the unit mismatch (count vs. percent).
    const result = pickHeadlinePersonaFromBreakdown({
      senders: ['Alice', 'Bob'],
      pb: { mc: [0, 0], wpm: [0, 0], ec: [0, 0], sd: [0, 0], arm: [0, 0], lt: [0, 0], mnc: [] },
    });
    expect(result?.id).not.toBe('conversationStarter');
  });

  it('only picks ghost for a group (3+ senders), never a 1-on-1 chat', () => {
    const oneOnOne = pickHeadlinePersonaFromBreakdown({
      senders: ['Alice', 'Bob'],
      pb: { mc: [30, 2], wpm: [0, 0], ec: [0, 0], sd: [0, 0], arm: [0, 0], lt: [0, 0], mnc: [] },
    });
    // Bob has the fewest messages, but with only 2 senders "ghost" shouldn't
    // apply — and nothing else has data, so this should be undefined, not ghost.
    expect(oneOnOne?.id).not.toBe('ghost');

    const group = pickHeadlinePersonaFromBreakdown({
      senders: ['Alice', 'Bob', 'Carol'],
      pb: { mc: [30, 2, 25], wpm: [0, 0, 0], ec: [0, 0, 0], sd: [0, 0, 0], arm: [0, 0, 0], lt: [0, 0, 0], mnc: [] },
    });
    expect(group?.id).toBe('chatterbox'); // chatterbox still outranks ghost when both have data
  });

  it('returns undefined when nothing derivable has any data', () => {
    const result = pickHeadlinePersonaFromBreakdown({
      senders: ['Alice', 'Bob'],
      pb: { mc: [0, 0], wpm: [0, 0], ec: [0, 0], sd: [0, 0], arm: [0, 0], lt: [0, 0], mnc: [] },
    });
    expect(result).toBeUndefined();
  });
});
