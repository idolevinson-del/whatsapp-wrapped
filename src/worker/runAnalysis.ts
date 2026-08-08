import { parseChat } from '../parser';
import { analyzeChat } from '../analysis';
import type { AnalysisOutcome, ProgressStage } from './types';

/**
 * Runs the parser and analysis pipeline on raw chat text. Pure function so it
 * can be unit tested directly and reused inside the Web Worker.
 */
export function runAnalysis(
  text: string,
  onProgress?: (stage: ProgressStage) => void
): AnalysisOutcome {
  onProgress?.('parsing');
  const { messages, diagnostics } = parseChat(text);

  if (messages.length === 0) {
    return { ok: false, error: { code: 'no-messages' } };
  }

  onProgress?.('analyzing');
  const analysis = analyzeChat(messages);

  return { ok: true, diagnostics, analysis };
}
