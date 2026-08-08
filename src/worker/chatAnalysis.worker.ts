import { runAnalysis } from './runAnalysis';
import type { WorkerRequest, WorkerResponse } from './types';

const ctx = self as unknown as Worker;

ctx.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { text } = event.data;

  try {
    const outcome = runAnalysis(text, (stage) => {
      const progress: WorkerResponse = { type: 'progress', stage };
      ctx.postMessage(progress);
    });

    const response: WorkerResponse = outcome.ok
      ? { type: 'result', diagnostics: outcome.diagnostics, analysis: outcome.analysis }
      : { type: 'error', error: outcome.error };

    ctx.postMessage(response);
  } catch {
    const response: WorkerResponse = { type: 'error', error: { code: 'unknown' } };
    ctx.postMessage(response);
  }
};

export {};
