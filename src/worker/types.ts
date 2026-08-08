import type { ParseDiagnostics } from '../parser';
import type { AnalysisResult } from '../analysis';

export type ProgressStage = 'parsing' | 'analyzing';

/**
 * Error codes (not user-facing strings) so the UI layer can render a
 * localized message via the i18n dictionaries.
 */
export type AppErrorCode = 'not-txt' | 'zip-no-chat' | 'no-messages' | 'unknown';

export interface AppError {
  code: AppErrorCode;
  /** Present for 'not-txt' errors. */
  fileName?: string;
}

export interface AnalyzeRequest {
  type: 'analyze';
  text: string;
}

export type WorkerRequest = AnalyzeRequest;

export interface ProgressResponse {
  type: 'progress';
  stage: ProgressStage;
}

export interface ResultResponse {
  type: 'result';
  diagnostics: ParseDiagnostics;
  analysis: AnalysisResult;
}

export interface ErrorResponse {
  type: 'error';
  error: AppError;
}

export type WorkerResponse = ProgressResponse | ResultResponse | ErrorResponse;

export type AnalysisOutcome =
  | { ok: true; diagnostics: ParseDiagnostics; analysis: AnalysisResult }
  | { ok: false; error: AppError };
