import { describe, expect, it } from 'vitest';
import { dropGroupNameAsSender } from './runAnalysis';
import type { ParsedMessage } from '../parser';

function msg(sender: string, text = 'hi'): ParsedMessage {
  return { timestamp: new Date('2024-01-01'), sender, text, isMedia: false };
}

describe('dropGroupNameAsSender', () => {
  it('drops a real group name mis-parsed as a sender (3+ real participants)', () => {
    const messages = [
      msg('Alice'),
      msg('Bob'),
      msg('Carol'),
      msg('Weekend Trip'), // the group's own name, mis-attributed as a sender
    ];
    const result = dropGroupNameAsSender(messages, 'WhatsApp Chat - Weekend Trip.txt');
    expect(result.map((m) => m.sender)).toEqual(['Alice', 'Bob', 'Carol']);
  });

  it('never touches a 1-on-1 chat, even if the filename looks group-shaped', () => {
    // Regression: some export formats use a "Chat - Name" filename for a
    // plain 1-on-1 chat too, which parseChatName reads as isGroup: true.
    // Without the 3+ sender guard, every message from "יובל" here would be
    // deleted just because her name happens to equal the inferred name.
    const messages = [msg('Me', 'hey'), msg('יובל', 'hi!'), msg('יובל', 'how are you?'), msg('Me', 'good')];
    const result = dropGroupNameAsSender(messages, 'WhatsApp Chat - יובל.txt');
    expect(result).toHaveLength(4);
    expect(result.filter((m) => m.sender === 'יובל')).toHaveLength(2);
  });

  it('is a no-op with no filename', () => {
    const messages = [msg('Alice'), msg('Bob'), msg('Carol')];
    expect(dropGroupNameAsSender(messages, undefined)).toBe(messages);
  });
});
