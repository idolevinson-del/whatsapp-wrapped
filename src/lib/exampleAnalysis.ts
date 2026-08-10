import { analyzeChat } from '../analysis';
import type { AnalysisResult } from '../analysis';
import type { ParsedMessage } from '../parser/types';

/**
 * The "try it with sample data" chat — a 5-person friend group over ~12
 * weeks, deliberately written so every persona badge/locked stat has an
 * obvious winner instead of a flat, boring tie: Alex organizes everything
 * (Most Active), Sam's jokes land (Funniest), Jordan never sends a short
 * message (Biggest Yapper), Riley is awake at 2am more often than not
 * (Night Owl) and sends voice notes instead of typing while there (Voice
 * Message King), Casey says maybe three words a day but swears when they
 * do (Most Ignored *and* Potty Mouth). A group, not a 1-on-1, because the
 * "who really runs the group" framing this app leads with only pays off
 * with more than 2 people in the chat.
 *
 * A few scripts include an 'audio omitted'/curse-word line specifically so
 * the "Voice Message King" and "Potty Mouth" locked stats have real,
 * non-zero data to demo — those two categories don't naturally arise from
 * ordinary dialogue the way message counts or emoji use do.
 */
const ALEX = 'Alex';
const SAM = 'Sam';
const JORDAN = 'Jordan';
const RILEY = 'Riley';
const CASEY = 'Casey';

interface Line {
  sender: string;
  hour: number;
  minute: number;
  text: string;
  isMedia?: boolean;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

// Each script is one recognizable "kind of day" for the group — repeated
// across weeks (real friend groups *are* repetitive: gym Mondays, Sunday
// recaps) rather than hand-writing 84 unique days.
const MORNING_CHECKIN: Line[] = [
  { sender: ALEX, hour: 8, minute: 2, text: 'morning legends ☀️' },
  { sender: CASEY, hour: 8, minute: 5, text: 'morning' },
  {
    sender: JORDAN,
    hour: 8,
    minute: 20,
    text: "slept like garbage again, my brain won't stop thinking about that documentary from last night, we seriously need to talk about simulation theory at some point this week",
  },
  { sender: ALEX, hour: 8, minute: 22, text: "Jordan it's 8am 😭" },
  { sender: SAM, hour: 8, minute: 31, text: 'lmaooo Jordan waking up hot takes only' },
  { sender: CASEY, hour: 8, minute: 40, text: 'coffee ☕' },
  { sender: ALEX, hour: 8, minute: 41, text: 'same' },
  { sender: RILEY, hour: 8, minute: 50, text: "still up don't @ me 🌙" },
  { sender: SAM, hour: 8, minute: 51, text: 'RILEY GO TO SLEEP 😂' },
];

const MEME_DUMP: Line[] = [
  {
    sender: SAM,
    hour: 13,
    minute: 10,
    text: 'holy shit, just saw a guy fall off his scooter and do a full superhero landing recovery, 10/10 no notes',
  },
  { sender: ALEX, hour: 13, minute: 11, text: 'hahahaha no way' },
  { sender: JORDAN, hour: 13, minute: 12, text: '😂😂😂' },
  { sender: SAM, hour: 13, minute: 15, text: '<Media omitted>', isMedia: true },
  { sender: CASEY, hour: 13, minute: 20, text: '😂' },
  { sender: SAM, hour: 13, minute: 40, text: "ok new bit: what if we started every message with 'breaking news'" },
  { sender: RILEY, hour: 13, minute: 41, text: "haha I'm in" },
  { sender: ALEX, hour: 13, minute: 42, text: "BREAKING NEWS: I'm hungry" },
  { sender: SAM, hour: 13, minute: 43, text: '🤣🤣🤣' },
  { sender: JORDAN, hour: 13, minute: 50, text: 'BREAKING NEWS: Jordan has thoughts' },
  { sender: SAM, hour: 13, minute: 51, text: 'hahaha of course you do' },
  { sender: CASEY, hour: 14, minute: 0, text: 'BREAKING NEWS: Casey has said 4 words today' },
];

const WEEKEND_PLANS: Line[] = [
  { sender: ALEX, hour: 18, minute: 0, text: 'ok WHO is actually free this weekend' },
  { sender: SAM, hour: 18, minute: 1, text: 'me' },
  { sender: CASEY, hour: 18, minute: 2, text: 'maybe' },
  {
    sender: JORDAN,
    hour: 18,
    minute: 5,
    text: "depends what we're doing, if it's another one of Alex's 6am hike ideas I'm out",
  },
  { sender: ALEX, hour: 18, minute: 6, text: 'it was ONE fucking time Jordan' },
  { sender: SAM, hour: 18, minute: 7, text: 'it was three times 😂' },
  { sender: RILEY, hour: 18, minute: 30, text: 'I vote beach' },
  { sender: CASEY, hour: 18, minute: 31, text: '+1 beach' },
  { sender: ALEX, hour: 18, minute: 32, text: 'beach it is, Sam bring the speaker' },
  { sender: SAM, hour: 18, minute: 33, text: 'on it' },
  { sender: SAM, hour: 18, minute: 34, text: 'audio omitted', isMedia: true },
  { sender: JORDAN, hour: 18, minute: 40, text: 'can Riley actually wake up before noon for this' },
  { sender: RILEY, hour: 18, minute: 41, text: 'excuse me I have arrived on time to things before' },
  { sender: SAM, hour: 18, minute: 42, text: 'name one time 💀' },
  { sender: RILEY, hour: 18, minute: 43, text: '...' },
  { sender: ALEX, hour: 18, minute: 44, text: '😂😂😂' },
  { sender: CASEY, hour: 18, minute: 50, text: 'what time are we thinking' },
  { sender: ALEX, hour: 18, minute: 51, text: '10am' },
  { sender: RILEY, hour: 18, minute: 52, text: 'make it 12' },
  {
    sender: JORDAN,
    hour: 18,
    minute: 53,
    text: "11 and that's final, I'm not negotiating with Riley's sleep schedule again",
  },
  { sender: SAM, hour: 18, minute: 54, text: "11 works, I'll text everyone in the morning" },
];

const LATE_NIGHT_RILEY: Line[] = [
  { sender: RILEY, hour: 1, minute: 12, text: "does anyone else think about how weird it is that we're all just floating on a rock" },
  { sender: RILEY, hour: 1, minute: 14, text: 'no? just me? shit, ok' },
  { sender: RILEY, hour: 1, minute: 20, text: 'audio omitted', isMedia: true },
  { sender: RILEY, hour: 1, minute: 40, text: 'also I reorganized my entire closet at 1am for no reason' },
  { sender: RILEY, hour: 2, minute: 10, text: 'anyway goodnight for real this time' },
  { sender: SAM, hour: 8, minute: 5, text: 'Riley what is happening to you' },
  { sender: RILEY, hour: 8, minute: 10, text: 'sleep is a social construct' },
  { sender: JORDAN, hour: 8, minute: 11, text: 'it is also a biological necessity Riley' },
];

const JORDAN_RANT: Line[] = [
  {
    sender: JORDAN,
    hour: 20,
    minute: 15,
    text: "ok so I've been thinking about this a lot and I really think the reason group chats die is not because people get bored of each other but because someone stops responding fast enough and then everyone silently agrees to let the thread cool down and it's honestly kind of sad if you think about it, we should have a rule against that",
  },
  { sender: JORDAN, hour: 20, minute: 16, text: 'audio omitted', isMedia: true },
  { sender: ALEX, hour: 20, minute: 20, text: "Jordan it's 8pm on a tuesday" },
  { sender: SAM, hour: 20, minute: 21, text: 'the group chat philosopher has entered the chat 😂' },
  { sender: CASEY, hour: 20, minute: 25, text: "he's not wrong though" },
  { sender: JORDAN, hour: 20, minute: 26, text: 'thank you Casey, finally someone gets it' },
  { sender: RILEY, hour: 20, minute: 40, text: 'I read the first three words and moved on ngl' },
  { sender: JORDAN, hour: 20, minute: 41, text: 'wow ok' },
  { sender: SAM, hour: 20, minute: 42, text: 'hahaha Riley savage today' },
  { sender: ALEX, hour: 20, minute: 45, text: 'group chat rule #1: no essays after 8pm, Jordan' },
];

const GYM_MONDAY: Line[] = [
  { sender: ALEX, hour: 6, minute: 45, text: "gym in 20, who's coming" },
  { sender: CASEY, hour: 6, minute: 50, text: 'in' },
  { sender: SAM, hour: 6, minute: 55, text: "absolutely not, mondays are a scam" },
  { sender: ALEX, hour: 6, minute: 56, text: '😂 fine more gains for us' },
  { sender: CASEY, hour: 6, minute: 57, text: '🏋️' },
  { sender: CASEY, hour: 6, minute: 58, text: 'audio omitted', isMedia: true },
  { sender: JORDAN, hour: 8, minute: 0, text: 'did yall actually go' },
  { sender: ALEX, hour: 8, minute: 1, text: 'yes and Casey out-lifted me it was humbling' },
  { sender: CASEY, hour: 8, minute: 2, text: '😂 finally my time to shine, this is fucking incredible' },
  { sender: SAM, hour: 8, minute: 3, text: 'meanwhile I lifted my blanket back over my head, also a workout' },
  { sender: ALEX, hour: 8, minute: 4, text: 'hahaha valid' },
];

const FOOD_PICS: Line[] = [
  { sender: SAM, hour: 12, minute: 30, text: '<Media omitted>', isMedia: true },
  { sender: SAM, hour: 12, minute: 31, text: 'lunch is elite today' },
  { sender: ALEX, hour: 12, minute: 32, text: 'SEND LOCATION' },
  { sender: SAM, hour: 12, minute: 33, text: 'sending' },
  { sender: JORDAN, hour: 12, minute: 40, text: '<Media omitted>', isMedia: true },
  { sender: JORDAN, hour: 12, minute: 41, text: 'mine looks sad in comparison' },
  { sender: CASEY, hour: 12, minute: 45, text: '😂😂' },
  { sender: RILEY, hour: 12, minute: 50, text: "I'm still asleep, this is a personal attack" },
];

const WORK_COMPLAINTS: Line[] = [
  { sender: JORDAN, hour: 15, minute: 0, text: 'my manager just scheduled a fucking meeting to discuss another meeting' },
  { sender: ALEX, hour: 15, minute: 1, text: 'hahahaha corporate really said that' },
  { sender: SAM, hour: 15, minute: 2, text: '😂😂😂 rough' },
  { sender: CASEY, hour: 15, minute: 10, text: 'at least you have a manager who schedules shit, mine just shows up' },
  { sender: JORDAN, hour: 15, minute: 11, text: 'that sounds worse honestly' },
  { sender: RILEY, hour: 15, minute: 30, text: 'meanwhile I just woke up, no notes' },
  { sender: SAM, hour: 15, minute: 31, text: 'must be nice' },
  { sender: ALEX, hour: 15, minute: 32, text: '😂 the audacity' },
  { sender: JORDAN, hour: 15, minute: 40, text: 'anyway I need a vacation' },
  { sender: CASEY, hour: 15, minute: 41, text: "same, add me to whatever Alex is planning" },
];

const TRIVIA_GAME: Line[] = [
  { sender: ALEX, hour: 19, minute: 0, text: "ok trivia night, I'll go first: what year did the first iPhone come out" },
  { sender: SAM, hour: 19, minute: 0, text: '2007' },
  { sender: ALEX, hour: 19, minute: 1, text: 'too fast Sam let someone else guess' },
  { sender: CASEY, hour: 19, minute: 1, text: '2007' },
  { sender: JORDAN, hour: 19, minute: 2, text: 'i was going to say that' },
  { sender: RILEY, hour: 19, minute: 10, text: 'I thought it was 2005 lol' },
  { sender: ALEX, hour: 19, minute: 11, text: "Riley that's not even close 😂" },
  { sender: SAM, hour: 19, minute: 12, text: 'next question' },
  { sender: JORDAN, hour: 19, minute: 13, text: 'ok my turn: capital of Australia' },
  { sender: ALEX, hour: 19, minute: 13, text: 'Sydney' },
  { sender: SAM, hour: 19, minute: 14, text: "wrong it's Canberra" },
  { sender: ALEX, hour: 19, minute: 14, text: 'since when' },
  { sender: CASEY, hour: 19, minute: 15, text: 'since always Alex 😂' },
  { sender: RILEY, hour: 19, minute: 16, text: 'I did not know that either ngl' },
  { sender: JORDAN, hour: 19, minute: 17, text: 'this is why we do trivia night' },
];

const SUNDAY_RECAP: Line[] = [
  { sender: CASEY, hour: 21, minute: 0, text: 'good week everyone' },
  { sender: ALEX, hour: 21, minute: 1, text: 'agreed, shoutout Sam for organizing everything as usual' },
  { sender: SAM, hour: 21, minute: 2, text: 'aww stop it 🥹' },
  { sender: JORDAN, hour: 21, minute: 3, text: 'shoutout Casey for finally texting more than one word at a time' },
  { sender: CASEY, hour: 21, minute: 4, text: '😂 rude but fair, damn' },
  { sender: RILEY, hour: 21, minute: 5, text: 'shoutout me for surviving on 4 hours of sleep all week' },
  { sender: ALEX, hour: 21, minute: 6, text: "Riley that's not something to be proud of" },
  { sender: SAM, hour: 21, minute: 7, text: 'hahaha true' },
  { sender: ALEX, hour: 21, minute: 8, text: 'audio omitted', isMedia: true },
  { sender: JORDAN, hour: 21, minute: 10, text: 'anyway love you weirdos, see everyone next week' },
  { sender: CASEY, hour: 21, minute: 11, text: '❤️' },
];

/** Sunday(0) through Saturday(6) — some days stack two scripts, matching how
 * an actually-active group chat clusters around evenings and weekends. */
const WEEK_PLAN: Line[][][] = [
  [SUNDAY_RECAP, LATE_NIGHT_RILEY], // Sun
  [GYM_MONDAY, WORK_COMPLAINTS], // Mon
  [MEME_DUMP, JORDAN_RANT], // Tue
  [MORNING_CHECKIN, WORK_COMPLAINTS], // Wed
  [FOOD_PICS, LATE_NIGHT_RILEY], // Thu
  [WEEKEND_PLANS], // Fri
  [TRIVIA_GAME, MEME_DUMP], // Sat
];

const WEEKS = 12;

function buildExampleMessages(): ParsedMessage[] {
  const messages: ParsedMessage[] = [];

  for (let day = 0; day < WEEKS * 7; day++) {
    const date = new Date(2024, 0, 1 + day);
    const d = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    const scripts = WEEK_PLAN[date.getDay()];

    for (const script of scripts) {
      for (const line of script) {
        messages.push({
          sender: line.sender,
          timestamp: new Date(`${d}T${pad(line.hour)}:${pad(line.minute)}:00`),
          text: line.text,
          isMedia: line.isMedia ?? false,
        });
      }
    }
  }

  // Some days stack two scripts (see WEEK_PLAN) that aren't pushed in
  // chronological order relative to each other (e.g. a 9pm recap pushed
  // before that same day's 1am late-night messages) — sort once at the end
  // rather than thread ordering through every script. A few analysis
  // functions (personas.ts's comedian/laugh-adjacency in particular) rely on
  // array order matching timestamp order, same as they do for a real parsed
  // export, which is always chronological.
  return messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

export function buildExampleAnalysis(): AnalysisResult {
  return analyzeChat(buildExampleMessages());
}
