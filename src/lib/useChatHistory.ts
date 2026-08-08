import { useCallback, useState } from 'react';
import { clearHistory, deleteHistoryEntry, getHistory, saveHistoryEntry, touchHistoryEntry } from './chatHistory';
import type { ChatHistoryEntry } from './chatHistory';
import type { AnalysisResult } from '../analysis';

export function useChatHistory() {
  const [entries, setEntries] = useState<ChatHistoryEntry[]>(() => getHistory());

  const save = useCallback((fileName: string, analysis: AnalysisResult) => {
    saveHistoryEntry(fileName, analysis);
    setEntries(getHistory());
  }, []);

  const open = useCallback((id: string) => {
    touchHistoryEntry(id);
    setEntries(getHistory());
  }, []);

  const remove = useCallback((id: string) => {
    deleteHistoryEntry(id);
    setEntries(getHistory());
  }, []);

  const clear = useCallback(() => {
    clearHistory();
    setEntries(getHistory());
  }, []);

  return { entries, save, open, remove, clear };
}
