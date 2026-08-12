import { useEffect, useMemo, useState } from 'react';
import { useChatAnalysis } from './worker';
import { UploadPage } from './pages/UploadPage';
import { StatsPage } from './pages/StatsPage';
import { SharedStatsPage } from './pages/SharedStatsPage';
import { ExampleIntroCard } from './components/ExampleIntroCard';
// The original swipeable "story cards" flow is kept around (unused) so it
// can be brought back without rebuilding it — see pages/WrappedPage.tsx.
// SharedWrappedPage still renders old share links (?share=...), which only
// carry compact per-card data.
import { SharedWrappedPage } from './pages/WrappedPage';
import { ExportGuidePage } from './pages/ExportGuidePage';
import { initAnalytics, trackEvent, trackPageView } from './analytics';
import { useChatHistory } from './lib/useChatHistory';
import { buildExampleAnalysis } from './lib/exampleAnalysis';
import { hasSeenOnboarding, markOnboardingSeen } from './lib/onboarding';
import { decodeSharePayload } from './lib/shareLink';
import { decodeStatsSharePayload } from './lib/statsShareLink';
import { rebuildCardsFromPayload } from './pages/buildStoryCards';
import { isPremium } from './lib/premium';
import { he } from './i18n/he';
import { en } from './i18n/en';
import type { ChatHistoryEntry } from './lib/chatHistory';
import type { StoryCardData } from './pages/buildStoryCards';
import type { StatsSharePayload } from './lib/statsShareLink';

// How long the first-visit example stays up before it advances itself back
// to the real upload screen — see showExample/exampleAutoExitMs below.
const EXAMPLE_AUTO_EXIT_MS = 7000;

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
    return rebuildCardsFromPayload(payload, dict, isPremium());
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
  // First-ever visit (no history, never dismissed onboarding): show a brief
  // "heads up, what's next is just a demo" card before anything else — see
  // ExampleIntroCard for why. Its onDone flows into the example itself
  // (showExample below), so people still actually see what a Wrapped looks
  // like — the card only makes sure they know it isn't their own data.
  const [showIntroCard, setShowIntroCard] = useState(() => !hasSeenOnboarding());
  // Set by the intro card once it's done, or manually via the "See an
  // example" link on the upload page.
  const [showExample, setShowExample] = useState(false);
  // Only set when the example was reached via the intro card (first visit)
  // — it then advances itself back to the real upload screen on its own,
  // see StatsPage's autoExitMs. A deliberately-opened example ("See an
  // example") stays open until the visitor leaves it themselves.
  const [exampleAutoExitMs, setExampleAutoExitMs] = useState<number | undefined>(undefined);
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

  if (sharedStats) {
    return <SharedStatsPage payload={sharedStats} />;
  }

  if (sharedCards) {
    return <SharedWrappedPage cards={sharedCards} />;
  }

  if (showIntroCard) {
    return (
      <ExampleIntroCard
        onDone={() => {
          markOnboardingSeen();
          setShowIntroCard(false);
          setExampleAutoExitMs(EXAMPLE_AUTO_EXIT_MS);
          setShowExample(true);
        }}
      />
    );
  }

  if (showExample) {
    return (
      <StatsPage
        analysis={exampleAnalysis}
        fileName="WhatsApp Chat - Beach Trip Squad.txt"
        onBack={() => {
          setShowExample(false);
          setExampleAutoExitMs(undefined);
        }}
        isExample
        autoExitMs={exampleAutoExitMs}
      />
    );
  }

  if (historyEntry) {
    return <StatsPage analysis={historyEntry.analysis} fileName={historyEntry.fileName} onBack={() => setHistoryEntry(null)} />;
  }

  if (status === 'done' && result) {
    return <StatsPage analysis={result.analysis} fileName={result.fileName} onBack={reset} />;
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
