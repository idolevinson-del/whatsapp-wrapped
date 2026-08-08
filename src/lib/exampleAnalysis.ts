import { analyzeChat } from '../analysis';
import type { AnalysisResult } from '../analysis';
import type { ParsedMessage } from '../parser/types';

const ALEX = 'Alex';
const SAM = 'Sam';

function msg(sender: string, iso: string, text: string): ParsedMessage {
  return { sender, timestamp: new Date(iso), text, isMedia: false };
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function buildExampleMessages(): ParsedMessage[] {
  const messages: ParsedMessage[] = [];

  for (let day = 0; day < 21; day++) {
    const date = new Date(2024, 0, 1 + day);
    const d = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

    messages.push(msg(ALEX, `${d}T01:00:00`, "Can't sleep, replaying our weekend trip in my head 😄"));
    messages.push(msg(SAM, `${d}T01:03:00`, 'Haha same here! That hike was unreal 🥾😂😂'));
    messages.push(
      msg(
        ALEX,
        `${d}T01:08:00`,
        'We have to do it again soon. I already started looking at new trails and found like five that look perfect for us, way better than last time honestly',
      ),
    );
    messages.push(msg(SAM, `${d}T07:15:00`, "Good morning! ☀️☕ Coffee's ready, don't be late today"));
    messages.push(msg(ALEX, `${d}T07:17:00`, 'On it! Be there in 10 💪😄'));
  }

  return messages;
}

export function buildExampleAnalysis(): AnalysisResult {
  return analyzeChat(buildExampleMessages());
}
