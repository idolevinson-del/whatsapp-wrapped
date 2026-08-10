import { useCallback, useRef, useState } from 'react';
import type { ParseDiagnostics } from '../parser';
import type { AnalysisResult } from '../analysis';
import { extractChatText } from '../lib/extractChatFile';
import type { AppError, ProgressStage, WorkerRequest, WorkerResponse } from './types';

export interface ChatAnalysisResult {
  fileName: string;
  diagnostics: ParseDiagnostics;
  analysis: AnalysisResult;
}

type Status = 'idle' | 'processing' | 'done' | 'error';

interface ChatAnalysisState {
  status: Status;
  stage: ProgressStage | null;
  error: AppError | null;
  result: ChatAnalysisResult | null;
}

const initialState: ChatAnalysisState = { status: 'idle', stage: null, error: null, result: null };

export function useChatAnalysis() {
  const [state, setState] = useState<ChatAnalysisState>(initialState);
  const workerRef = useRef<Worker | null>(null);

  const analyzeFile = useCallback((file: File) => {
    workerRef.current?.terminate();
    setState({ status: 'processing', stage: 'parsing', error: null, result: null });

    void extractChatText(file).then((extracted) => {
      if (!extracted.ok) {
        const error: AppError =
          extracted.code === 'zip-no-chat' ? { code: 'zip-no-chat' } : { code: 'not-txt', fileName: file.name };
        setState({ status: 'error', stage: null, error, result: null });
        return;
      }

      const worker = new Worker(new URL('./chatAnalysis.worker.ts', import.meta.url), {
        type: 'module',
      });
      workerRef.current = worker;

      const cleanup = () => {
        worker.terminate();
        if (workerRef.current === worker) {
          workerRef.current = null;
        }
      };

      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const data = event.data;

        if (data.type === 'progress') {
          setState((prev) => ({ ...prev, stage: data.stage }));
          return;
        }

        if (data.type === 'result') {
          setState({
            status: 'done',
            stage: null,
            error: null,
            result: { fileName: file.name, diagnostics: data.diagnostics, analysis: data.analysis },
          });
        } else {
          setState({ status: 'error', stage: null, error: data.error, result: null });
        }

        cleanup();
      };

      worker.onerror = () => {
        setState({ status: 'error', stage: null, error: { code: 'unknown' }, result: null });
        cleanup();
      };

      const request: WorkerRequest = { type: 'analyze', text: extracted.text, fileName: file.name };
      worker.postMessage(request);
    });
  }, []);

  const reset = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    setState(initialState);
  }, []);

  return { ...state, analyzeFile, reset };
}
