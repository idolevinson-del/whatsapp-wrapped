import { useEffect, useMemo, useState } from 'react';
import { useChatAnalysis } from './worker';
import { UploadPage } from './pages/UploadPage';
import { WrappedPage, SharedWrappedPage } from './pages/WrappedPage';
import { ExportGuidePage } from './pages/ExportGuidePage';
import { initAnalytics, trackEvent, trackPageView } from './analytics';
import { useChatHistory } from './lib/useChatHistory';
import { buildExampleAnalysis } from './lib/exampleAnalysis';
import { decodeSharePayload } from './lib/shareLink';
import { rebuildCardsFromPayload } from './pages/buildStoryCards';
import { he } from './i18n/he';
import { en } from './i18n/en';
import type { ChatHistoryEntry } from './lib/chatHistory';
import type { StoryCardData } from './pages/buildStoryCards';

function App() {
  const [sharedCards] = useState<StoryCardData[] | null>(() => {
    const encoded = new URLSearchParams(window.location.search).get('share');
    if (!encoded) return null;
    const payload = decodeSharePayload(encoded);
    if (!payload) return null;
    const dict = payload.lang === 'he' ? he : en;
    return rebuildCardsFromPayload(payload, dict);
  });

  const { status, stage, error, result, analyzeFile, reset } = useChatAnalysis();
  const { entries: history, save: saveHistoryEntry, open: openHistoryEntry, remove: removeHistoryEntry } = useChatHistory();
  const [showGuide, setShowGuide] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const [historyEntry, setHistoryEntry] = useState<ChatHistoryEntry | null>(null);
  const exampleAnalysis = useMemo(() => buildExampleAnalysis(), []);

  useEffect(() => {
    initAnalytics();
    trackPageView();
  }, []);

  useEffect(() => {
    if (status === 'done' && result) {
      trackEvent('results_viewed');
      saveHistoryEntry(result.fileName, result.analysis);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, result]);

  if (sharedCards) {
    return <SharedWrappedPage cards={sharedCards} />;
  }

  if (showExample) {
    return <WrappedPage analysis={exampleAnalysis} onReset={() => setShowExample(false)} isExample />;
  }

  if (historyEntry) {
    return <WrappedPage analysis={historyEntry.analysis} fileName={historyEntry.fileName} onReset={() => setHistoryEntry(null)} />;
  }

  if (status === 'done' && result) {
    return <WrappedPage analysis={result.analysis} fileName={result.fileName} onReset={reset} />;
  }

  if (showGuide) {
    return <ExportGuidePage onBack={() => setShowGuide(false)} />;
  }

  function handleFileSelected(file: File) {
    trackEvent('file_uploaded');
    analyzeFile(file);
  }

  function handleOpenHistoryEntry(entry: ChatHistoryEntry) {
    openHistoryEntry(entry.id);
    setHistoryEntry(entry);
  }

  return (
    <UploadPage
      onFileSelected={handleFileSelected}
      error={error}
      isProcessing={status === 'processing'}
      stage={stage}
      onShowGuide={() => setShowGuide(true)}
      onShowExample={() => setShowExample(true)}
      history={history}
      onOpenHistoryEntry={handleOpenHistoryEntry}
      onDeleteHistoryEntry={removeHistoryEntry}
    />
  );
}

export default App;
