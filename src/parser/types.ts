export interface ParsedMessage {
  timestamp: Date;
  sender: string;
  text: string;
  isMedia: boolean;
}

export interface ParseDiagnostics {
  totalLines: number;
  parsedMessages: number;
  unmatchedLines: string[];
}

export interface ParseResult {
  messages: ParsedMessage[];
  diagnostics: ParseDiagnostics;
}
