import { useRef, useState } from 'react';
import { formatTemplate, useLanguage } from '../i18n';
import type { Dictionary } from '../i18n';
import { LanguagePicker } from '../components/LanguagePicker';
import { ChatHistoryList } from '../components/ChatHistoryList';
import { PremiumModal } from '../components/PremiumModal';
import { FREE_MAX_ENTRIES, getFreeLimit, getLifetimeAnalysisCount } from '../lib/chatHistory';
import type { ChatHistoryEntry } from '../lib/chatHistory';
import { isPremium } from '../lib/premium';
import { TRADEMARK_DISCLAIMER } from '../lib/legal';
import type { AppError, ProgressStage } from '../worker';

function errorMessage(error: AppError, dictionary: Dictionary): string {
  switch (error.code) {
    case 'not-txt':
      return formatTemplate(dictionary.upload.errorNotTxt, { fileName: error.fileName ?? '' });
    case 'zip-no-chat':
      return dictionary.upload.errorZipNoChat;
    case 'no-messages':
      return dictionary.upload.errorNoMessages;
    case 'unknown':
      return dictionary.upload.errorUnknown;
  }
}

interface UploadPageProps {
  onFileSelected: (file: File) => void;
  error: AppError | null;
  isProcessing: boolean;
  stage: ProgressStage | null;
  onShowGuide: () => void;
  onShowExample: () => void;
  history: ChatHistoryEntry[];
  onOpenHistoryEntry: (entry: ChatHistoryEntry) => void;
  onDeleteHistoryEntry: (id: string) => void;
  onClearHistory: () => void;
}

export function UploadPage({
  onFileSelected,
  error,
  isProcessing,
  stage,
  onShowGuide,
  onShowExample,
  history,
  onOpenHistoryEntry,
  onDeleteHistoryEntry,
  onClearHistory,
}: UploadPageProps) {
  const { dictionary } = useLanguage();
  const [isDragging, setIsDragging] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [premiumReason, setPremiumReason] = useState<string | null>(null);
  // Bumped (not read) whenever premium state changes in the modal — premium
  // itself lives in localStorage, not React state, so this just forces a
  // re-render to pick up the fresh value below.
  const [, forcePremiumRefresh] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const userIsPremium = isPremium();

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    // Gated on the lifetime count, not on how many chats are currently
    // saved — history.length drops back below the cap the moment someone
    // deletes an old entry, which would otherwise let the free limit be
    // bypassed indefinitely just by clearing history first. The limit
    // itself (getFreeLimit) isn't fixed — sharing raises it, see shareBonus.ts.
    const freeLimit = getFreeLimit();
    if (!userIsPremium && getLifetimeAnalysisCount() >= freeLimit) {
      setPremiumReason(formatTemplate(dictionary.premium.historyLimitReason, { count: freeLimit }));
      setShowPremium(true);
      return;
    }

    onFileSelected(file);
  }

  const stageLabel =
    stage === 'parsing'
      ? dictionary.upload.stageParsing
      : stage === 'analyzing'
        ? dictionary.upload.stageAnalyzing
        : null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
      <div
        className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 animate-pulse rounded-full bg-gradient-to-br from-amber-500 via-rose-500 to-purple-600 opacity-30 blur-3xl"
        style={{ animationDuration: '6s' }}
      />
      <div
        className="pointer-events-none absolute top-1/3 -right-32 h-96 w-96 animate-pulse rounded-full bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 opacity-30 blur-3xl"
        style={{ animationDuration: '8s' }}
      />
      <div
        className="pointer-events-none absolute bottom-0 left-1/4 h-96 w-96 animate-pulse rounded-full bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 opacity-20 blur-3xl"
        style={{ animationDuration: '10s' }}
      />

      <div className="absolute end-4 top-4 z-10">
        <LanguagePicker />
      </div>

      <div className="relative z-0 flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-xl text-center">
          <span className="inline-block animate-bounce text-5xl">💬</span>
          <h1 className="mt-4 bg-gradient-to-r from-amber-400 via-rose-400 to-purple-400 bg-clip-text text-5xl font-extrabold text-transparent sm:text-6xl">
            {dictionary.app.title}
          </h1>
          <p className="mt-3 text-lg font-semibold text-white/80">{dictionary.app.tagline}</p>
          <p className="mt-4 text-neutral-400">{dictionary.upload.description}</p>
          {!userIsPremium && (
            <p className="mt-1 text-sm text-neutral-500">
              {formatTemplate(dictionary.upload.freeLimitNote, { count: FREE_MAX_ENTRIES })}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <button
              type="button"
              onClick={onShowGuide}
              className="cursor-pointer text-sm font-medium text-amber-400 underline-offset-2 hover:underline"
            >
              {dictionary.upload.guideLink}
            </button>
            <button
              type="button"
              onClick={onShowExample}
              className="cursor-pointer text-sm font-medium text-amber-400 underline-offset-2 hover:underline"
            >
              {dictionary.onboarding.viewExampleLink}
            </button>
            <button
              type="button"
              onClick={() => {
                setPremiumReason(null);
                setShowPremium(true);
              }}
              className="cursor-pointer text-sm font-medium text-amber-400 underline-offset-2 hover:underline"
            >
              {dictionary.premium.entryLabel}
              {userIsPremium ? ' ✓' : ''}
            </button>
          </div>

          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFiles(e.dataTransfer.files);
            }}
            className={`mt-8 cursor-pointer rounded-2xl bg-gradient-to-br p-[2px] transition-all ${
              isDragging
                ? 'from-amber-400 via-rose-400 to-purple-500 scale-[1.02]'
                : 'from-white/20 via-white/10 to-white/20'
            }`}
          >
            <div
              className={`rounded-2xl p-12 transition-colors ${isDragging ? 'bg-neutral-900/60' : 'bg-neutral-950/60'}`}
            >
              {isProcessing ? (
                <div>
                  <p className="text-lg font-semibold">{stageLabel}</p>
                  <div className="mx-auto mt-4 h-1.5 w-48 overflow-hidden rounded-full bg-neutral-800">
                    <div className="h-full w-1/3 animate-pulse rounded-full bg-gradient-to-r from-amber-400 via-rose-400 to-purple-400" />
                  </div>
                </div>
              ) : (
                <>
                  <span className="text-4xl">📂</span>
                  <p className="mt-3 text-lg font-semibold">{dictionary.upload.dropzoneTitle}</p>
                  <p className="mt-1 text-sm text-neutral-400">{dictionary.upload.dropzoneSubtitle}</p>
                </>
              )}
            </div>
          </div>

          <input
            ref={inputRef}
            type="file"
            // Extensions alone make Chrome filter by MIME type under the hood —
            // cloud providers (Drive and friends) often report a generic type
            // for files saved through them, which can hide/gray out an export
            // that never went through a plain "Save to Files" flow. Listing
            // the MIME types too keeps the picker from filtering those out;
            // extractChatFile still sniffs content, so this only affects what
            // shows up in the picker, not what's accepted afterwards.
            accept=".txt,.zip,text/plain,application/zip,application/x-zip-compressed,application/octet-stream"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          {error && (
            <p className="mt-4 rounded-md border border-red-500 bg-red-950 p-3 text-sm font-medium text-red-300">
              {errorMessage(error, dictionary)}
            </p>
          )}

          <p className="mt-6 text-xs text-neutral-500">{dictionary.upload.privacyNote}</p>

          <ChatHistoryList
            entries={history}
            onOpen={onOpenHistoryEntry}
            onDelete={onDeleteHistoryEntry}
            onClearAll={onClearHistory}
          />

          <p dir="ltr" className="mt-8 text-[11px] leading-relaxed text-neutral-600">
            {TRADEMARK_DISCLAIMER}
          </p>
        </div>
      </div>

      {showPremium && (
        <PremiumModal
          onClose={() => {
            setShowPremium(false);
            setPremiumReason(null);
          }}
          onPremiumChange={() => forcePremiumRefresh((n) => n + 1)}
          reason={premiumReason ?? undefined}
        />
      )}
    </div>
  );
}
