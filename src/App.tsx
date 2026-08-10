import { useEffect, useMemo, useState } from 'react';
import { useChatAnalysis } from './worker';
import { UploadPage } from './pages/UploadPage';
import { StatsPage } from './pages/StatsPage';
import { SharedStatsPage } from './pages/SharedStatsPage';
// The swipeable "story cards" reveal is the first thing shown after a fresh,
// real upload — see the `status === 'done'` branch below. SharedWrappedPage
// still renders old share links (?share=...), which only carry compact
// per-card data.
import { WrappedPage, SharedWrappedPage } from './pages/WrappedPage';
import { ExportGuidePage } from './pages/ExportGuidePage';
import { initAnalytics, trackEvent, trackPageView } from './analytics';
import { useChatHistory } from './lib/useChatHistory';
import { buildExampleAnalysis } from './lib/exampleAnalysis';
import { hasSeenOnboarding, markOnboardingSeen } from './lib/onboarding';
import { decodeSharePayload } from './lib/shareLink';
import { decodeStatsSharePayload } from './lib/statsShareLink';
import { rebuildCardsFromPayload } from './pages/buildStoryCards';
import { he } from './i18n/he';
import { en } from './i18n/en';
import type { ChatHistoryEntry } from './lib/chatHistory';
import type { StoryCardData } from './pages/buildStoryCards';
import type { StatsSharePayload } from './lib/statsShareLink';

function App() {
  // Someone's actual results, received via the "Share to WhatsApp" link.
  const [sharedStats] = useState<StatsSharePayload | null>(() => {
    const encoded = new URLSearchParams(window.location.search).get('stats');
    if (!encoded) return null;
    return decodeStatsSharePayload(encoded);
  });

  // Old card-based share links (?share=...) — the flow that produced them is
  // retired, but a link already sent out should keep working.
  const [sharedCards] = useState<StoryCardData[] | null>(() => {
    const encoded = new URLSearchParams(window.location.search).get('share');
    if (!encoded) return null;
    const payload = decodeSharePayload(encoded);
    if (!payload) return null;
    const dict = payload.lang === 'he' ? he : en;
    return rebuildCardsFromPayload(payload, dict);
  });

  const { status, stage, error, result, analyzeFile, reset } = useChatAnalysis();
  const {
    entries: history,
    save: saveHistoryEntry,
    open: openHistoryEntry,
    remove: removeHistoryEntry,
    clear: clearHistory,
  } = useChatHistory();
  const [showGuide, setShowGuide] = useState(false);
  // First-ever visit (no history, never dismissed onboarding): open straight
  // into the live example instead of a blank upload page, so trust is built
  // before we ask for real data. Marked seen immediately so a reload or
  // leaving the example doesn't loop back into it.
  const [showExample, setShowExample] = useState(() => !hasSeenOnboarding());
  const [historyEntry, setHistoryEntry] = useState<ChatHistoryEntry | null>(null);
  const exampleAnalysis = useMemo(() => buildExampleAnalysis(), []);

  useEffect(() => {
    initAnalytics();
    trackPageView();
  }, []);

  useEffect(() => {
    if (showExample) markOnboardingSeen();
    // Only ever runs for the auto-shown first-visit example (see initializer above).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (status === 'done' && result) {
      trackEvent('results_viewed');
      saveHistoryEntry(result.fileName, result.analysis);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, result]);

  if (sharedStats) {
    return <SharedStatsPage payload={sharedStats} />;
  }

  if (sharedCards) {
    return <SharedWrappedPage cards={sharedCards} />;
  }

  if (showExample) {
    return <StatsPage analysis={exampleAnalysis} onBack={() => setShowExample(false)} isExample />;
  }

  if (historyEntry) {
    return <StatsPage analysis={historyEntry.analysis} fileName={historyEntry.fileName} onBack={() => setHistoryEntry(null)} />;
  }

  if (status === 'done' && result) {
    // A fresh, real upload gets the full "reveal" moment first — swipeable
    // persona cards, one at a time — before landing on the comprehensive
    // stats page. Reopened history entries and shared links skip straight
    // to StatsPage (see below): the reveal is a first-impression thing, not
    // something to replay every time.
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
      onClearHistory={clearHistory}
    />
  );
}

export default App;
