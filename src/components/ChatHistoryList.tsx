import { useState } from 'react';
import { formatTemplate, useLanguage } from '../i18n';
import { formatDate } from '../lib/formatDate';
import { ConfirmDialog } from './ConfirmDialog';
import type { ChatHistoryEntry } from '../lib/chatHistory';

interface ChatHistoryListProps {
  entries: ChatHistoryEntry[];
  onOpen: (entry: ChatHistoryEntry) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export function ChatHistoryList({ entries, onOpen, onDelete, onClearAll }: ChatHistoryListProps) {
  const { dictionary, language } = useLanguage();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [confirmingClearAll, setConfirmingClearAll] = useState(false);

  if (entries.length === 0) return null;

  return (
    <div className="mt-10 w-full text-start">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80">{dictionary.history.title}</h2>
        <button
          type="button"
          onClick={() => setConfirmingClearAll(true)}
          className="cursor-pointer text-xs font-medium text-white/50 underline-offset-2 hover:text-red-400 hover:underline"
        >
          {dictionary.history.clearAllButton}
        </button>
      </div>

      <ul className="mt-3 space-y-2">
        {entries.map((entry) => {
          const messageCount = entry.analysis.coreStats.perSender.reduce((sum, s) => sum + s.messageCount, 0);

          return (
            <li
              key={entry.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <button type="button" onClick={() => onOpen(entry)} className="cursor-pointer text-start">
                <p className="font-bold">{entry.fileName}</p>
                <p className="text-sm text-white/70">
                  {formatTemplate(dictionary.history.messageCountLabel, { count: messageCount })}
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  {formatTemplate(dictionary.history.lastViewedLabel, { date: formatDate(entry.lastViewedAt, language) })}
                </p>
              </button>

              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => onOpen(entry)}
                  className="cursor-pointer rounded-full border border-white/40 px-3 py-1.5 text-sm font-medium hover:bg-white/10"
                >
                  {dictionary.history.openButton}
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDeleteId(entry.id)}
                  className="cursor-pointer rounded-full border border-white/40 px-3 py-1.5 text-sm font-medium hover:bg-white/10"
                  aria-label={dictionary.history.deleteButton}
                >
                  🗑️
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {pendingDeleteId && (
        <ConfirmDialog
          title={dictionary.history.confirmDeleteTitle}
          message={dictionary.history.confirmDeleteMessage}
          confirmLabel={dictionary.history.confirmDeleteConfirm}
          cancelLabel={dictionary.history.confirmDeleteCancel}
          onConfirm={() => {
            onDelete(pendingDeleteId);
            setPendingDeleteId(null);
          }}
          onCancel={() => setPendingDeleteId(null)}
        />
      )}

      {confirmingClearAll && (
        <ConfirmDialog
          title={dictionary.history.confirmClearAllTitle}
          message={dictionary.history.confirmClearAllMessage}
          confirmLabel={dictionary.history.clearAllButton}
          cancelLabel={dictionary.history.confirmDeleteCancel}
          onConfirm={() => {
            onClearAll();
            setConfirmingClearAll(false);
          }}
          onCancel={() => setConfirmingClearAll(false)}
        />
      )}
    </div>
  );
}
