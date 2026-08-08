export interface MessageHeader {
  day: number;
  month: number;
  year: number;
  hour: number;
  minute: number;
  second: number;
  ampm?: 'AM' | 'PM';
  sender: string;
  text: string;
}

interface MessagePattern {
  name: string;
  regex: RegExp;
  extract: (m: RegExpMatchArray) => MessageHeader;
}

const AMPM = '([AaPp][Mm])';

// Each pattern matches the START of a new message ("header line"). Lines that
// don't match any pattern are treated as a continuation of the previous
// message (multi-line message body).
export const MESSAGE_PATTERNS: MessagePattern[] = [
  // iPhone (Hebrew/most locales), dot-separated date, 24h with seconds:
  // [23.11.2021, 10:24:23] Name: text
  {
    name: 'iphone-dot-24h',
    regex: /^\[(\d{1,2})\.(\d{1,2})\.(\d{2,4}), (\d{1,2}):(\d{2}):(\d{2})\] (.+?): ([\s\S]*)$/,
    extract: (m) => ({
      day: Number(m[1]),
      month: Number(m[2]),
      year: Number(m[3]),
      hour: Number(m[4]),
      minute: Number(m[5]),
      second: Number(m[6]),
      sender: m[7],
      text: m[8],
    }),
  },
  // iPhone, dot-separated date, 12h with AM/PM:
  // [23.11.2021, 10:24:23 PM] Name: text
  {
    name: 'iphone-dot-12h',
    regex: new RegExp(
      `^\\[(\\d{1,2})\\.(\\d{1,2})\\.(\\d{2,4}), (\\d{1,2}):(\\d{2}):(\\d{2})\\s*${AMPM}\\] (.+?): ([\\s\\S]*)$`
    ),
    extract: (m) => ({
      day: Number(m[1]),
      month: Number(m[2]),
      year: Number(m[3]),
      hour: Number(m[4]),
      minute: Number(m[5]),
      second: Number(m[6]),
      ampm: m[7].toUpperCase() as 'AM' | 'PM',
      sender: m[8],
      text: m[9],
    }),
  },
  // iPhone, slash-separated date (US locale, MM/DD/YYYY), 24h with seconds:
  // [11/23/2021, 10:24:23] Name: text
  {
    name: 'iphone-slash-24h',
    regex: /^\[(\d{1,2})\/(\d{1,2})\/(\d{2,4}), (\d{1,2}):(\d{2}):(\d{2})\] (.+?): ([\s\S]*)$/,
    extract: (m) => ({
      day: Number(m[2]),
      month: Number(m[1]),
      year: Number(m[3]),
      hour: Number(m[4]),
      minute: Number(m[5]),
      second: Number(m[6]),
      sender: m[7],
      text: m[8],
    }),
  },
  // Android, no brackets, dash separator, 24h, no seconds (DD/MM/YYYY):
  // 23/11/2021, 22:15 - Name: text
  {
    name: 'android-dash-24h',
    regex: /^(\d{1,2})\/(\d{1,2})\/(\d{2,4}), (\d{1,2}):(\d{2}) - (.+?): ([\s\S]*)$/,
    extract: (m) => ({
      day: Number(m[1]),
      month: Number(m[2]),
      year: Number(m[3]),
      hour: Number(m[4]),
      minute: Number(m[5]),
      second: 0,
      sender: m[6],
      text: m[7],
    }),
  },
  // Android, no brackets, dash separator, 12h AM/PM, US date order (MM/DD/YY):
  // 11/23/21, 10:15 PM - Name: text
  {
    name: 'android-dash-12h-mdy',
    regex: new RegExp(
      `^(\\d{1,2})/(\\d{1,2})/(\\d{2,4}), (\\d{1,2}):(\\d{2})\\s*${AMPM} - (.+?): ([\\s\\S]*)$`
    ),
    extract: (m) => ({
      day: Number(m[2]),
      month: Number(m[1]),
      year: Number(m[3]),
      hour: Number(m[4]),
      minute: Number(m[5]),
      second: 0,
      ampm: m[6].toUpperCase() as 'AM' | 'PM',
      sender: m[7],
      text: m[8],
    }),
  },
];

export function matchMessageHeader(line: string): MessageHeader | null {
  for (const pattern of MESSAGE_PATTERNS) {
    const m = line.match(pattern.regex);
    if (m) return pattern.extract(m);
  }
  return null;
}
