import type { ReactNode } from 'react';
import type { GuideStep } from './types';

/** WhatsApp's own dark-mode palette — used only while a step is "inside WhatsApp",
 * so the mockup reads as WhatsApp rather than a generic app. */
const WA = {
  bg: '#0b141a',
  header: '#202c33',
  in: '#1f2c34',
  out: '#005c4b',
  text: '#e9edef',
  sub: '#8696a0',
  green: '#00a884',
  tick: '#53bdeb',
  ring: '#fde68a',
};

interface ContactContext {
  contactName: string;
  contactSub: string;
  messages: { text: string; time: string; out?: boolean }[];
}

/** Pulsing ring around whatever is being pointed at. */
function Highlight({ children, className = 'inline-flex' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`relative ${className}`}>
      {children}
      <span
        className="pointer-events-none absolute -inset-1.5 rounded-lg border-2 animate-[pulse-ring_1.6s_ease-out_infinite]"
        style={{ borderColor: WA.ring }}
      />
    </span>
  );
}

function StatusBar() {
  return (
    <div className="flex items-center justify-between px-4 pb-0.5 pt-1 text-[11px] font-bold" style={{ color: WA.text }}>
      <span>21:47</span>
      <span>••• 📶 🔋</span>
    </div>
  );
}

function Avatar() {
  return (
    <span
      className="h-[30px] w-[30px] shrink-0 rounded-full"
      style={{ background: 'linear-gradient(135deg, #3a4a52, #263238)' }}
    />
  );
}

function WaHeader({ name, sub, highlight }: { name: string; sub: string; highlight?: 'menu' | 'name' }) {
  const identity = (
    <span className="flex min-w-0 items-center gap-2">
      <Avatar />
      <span className="min-w-0">
        <span className="block truncate text-[13.5px] font-bold">{name}</span>
        <span className="block truncate text-[10px]" style={{ color: WA.sub }}>
          {sub}
        </span>
      </span>
    </span>
  );

  return (
    <div className="flex items-center gap-2 px-2.5 py-1.5" style={{ background: WA.header, color: WA.text }}>
      <span className="text-lg">‹</span>
      {highlight === 'name' ? (
        <Highlight className="flex min-w-0 flex-1">{identity}</Highlight>
      ) : (
        <span className="min-w-0 flex-1">{identity}</span>
      )}
      <span className="shrink-0 text-[15px] opacity-90">📹</span>
      <span className="shrink-0 text-[15px] opacity-90">📞</span>
      {highlight === 'menu' ? (
        <Highlight>
          <span className="px-0.5 text-[15px] font-black tracking-tighter" style={{ color: WA.ring }}>
            ⋮
          </span>
        </Highlight>
      ) : (
        <span className="shrink-0 px-0.5 text-[15px] font-black tracking-tighter opacity-90">⋮</span>
      )}
    </div>
  );
}

function ChatScreen({ contactName, contactSub, messages, highlight }: ContactContext & { highlight: 'menu' | 'name' }) {
  return (
    <div className="flex h-full flex-col" style={{ background: WA.bg }}>
      <StatusBar />
      <WaHeader name={contactName} sub={contactSub} highlight={highlight} />
      <div
        className="flex flex-1 flex-col gap-2 p-3"
        style={{
          backgroundColor: WA.bg,
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.035) 1px, transparent 0)',
          backgroundSize: '15px 15px',
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[74%] rounded-[9px] px-2.5 py-1.5 text-[11px] leading-snug ${
              m.out ? 'self-end rounded-bl-[2px]' : 'self-start rounded-br-[2px]'
            }`}
            style={{ background: m.out ? WA.out : WA.in, color: WA.text }}
          >
            {m.text}
            <span className="mt-0.5 block text-end text-[8.5px]" style={{ color: m.out ? '#a8d5c9' : WA.sub }}>
              {m.time} {m.out && <span style={{ color: WA.tick }}>✓✓</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Chat header (undimmed) + a dark scrim + whatever overlay panel is passed in. */
function OverlayScreen({
  name,
  sub,
  scrim = 'bg-black/60',
  children,
}: {
  name: string;
  sub: string;
  scrim?: string;
  children: ReactNode;
}) {
  return (
    <div className="relative flex h-full flex-col" style={{ background: WA.bg }}>
      <StatusBar />
      <WaHeader name={name} sub={sub} />
      <div className={`pointer-events-none absolute inset-0 ${scrim}`} />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}

function MenuPanel({ items, highlightIndex }: { items: string[]; highlightIndex: number }) {
  return (
    <div
      className="absolute start-2.5 top-[46px] w-[178px] overflow-hidden rounded-lg border"
      style={{ background: '#233138', borderColor: 'rgba(255,255,255,0.08)' }}
    >
      {items.map((item, i) => (
        <div
          key={item}
          className="border-b px-3 py-2.5 text-[11.5px] last:border-b-0"
          style={{
            color: WA.text,
            borderColor: 'rgba(255,255,255,0.06)',
            background: i === highlightIndex ? 'rgba(253,230,138,0.1)' : undefined,
            fontWeight: i === highlightIndex ? 700 : 400,
          }}
        >
          {i === highlightIndex ? (
            <Highlight>
              <span>{item}</span>
            </Highlight>
          ) : (
            item
          )}
        </div>
      ))}
    </div>
  );
}

function DialogPanel({
  question,
  options,
  highlightIndex,
}: {
  question: string;
  options: string[];
  highlightIndex: number;
}) {
  return (
    <div
      className="absolute left-1/2 top-1/2 w-[204px] -translate-x-1/2 -translate-y-1/2 rounded-xl border p-4 text-center"
      style={{ background: '#233138', borderColor: 'rgba(255,255,255,0.08)' }}
    >
      <p className="mb-3.5 text-[12px] font-semibold" style={{ color: WA.text }}>
        {question}
      </p>
      {options.map((opt, i) => (
        <div key={opt} className="mt-2 first:mt-0">
          {i === highlightIndex ? (
            <Highlight className="block w-full">
              <span
                className="block w-full rounded-lg py-2 text-[11px] font-bold tracking-wide"
                style={{ color: '#06281f', background: WA.ring }}
              >
                {opt}
              </span>
            </Highlight>
          ) : (
            <span
              className="block w-full rounded-lg border py-2 text-[11px] font-bold tracking-wide"
              style={{ color: WA.green, background: 'rgba(0,168,132,0.12)', borderColor: 'rgba(0,168,132,0.3)' }}
            >
              {opt}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function SharePanel({
  apps,
  highlightIndex,
}: {
  apps: { icon: string; label: string }[];
  highlightIndex: number;
}) {
  return (
    <div
      className="absolute inset-x-0 bottom-0 rounded-t-2xl border-t px-3.5 pb-5 pt-4"
      style={{ background: '#1c252b', borderColor: 'rgba(255,255,255,0.08)' }}
    >
      <div className="grid grid-cols-4 gap-3">
        {apps.map((app, i) => (
          <div key={app.label} className="flex flex-col items-center gap-1.5">
            {i === highlightIndex ? (
              <Highlight className="flex flex-col items-center">
                <span
                  className="flex h-[42px] w-[42px] items-center justify-center rounded-xl text-[18px]"
                  style={{ background: WA.ring, color: '#06281f' }}
                >
                  {app.icon}
                </span>
                <span className="mt-1.5 text-[9.5px] font-bold" style={{ color: WA.text }}>
                  {app.label}
                </span>
              </Highlight>
            ) : (
              <>
                <span
                  className="flex h-[42px] w-[42px] items-center justify-center rounded-xl text-[18px]"
                  style={{ background: '#2e3b41', color: WA.text }}
                >
                  {app.icon}
                </span>
                <span className="text-[9.5px]" style={{ color: WA.sub }}>
                  {app.label}
                </span>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Back in our own app — our gradient identity, deliberately not WhatsApp's. */
function AppUploadScreen({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 bg-neutral-950 p-5 text-center">
      <span className="mb-1 text-2xl">💬</span>
      <Highlight className="block w-full">
        <div className="w-full rounded-2xl border-2 border-dashed border-white/15 bg-white/5 px-3 py-5">
          <p className="text-[12px] font-bold text-white">{title}</p>
          <p className="mt-1 text-[10px] text-white/60">{subtitle}</p>
        </div>
      </Highlight>
    </div>
  );
}

function FilePickerScreen({
  header,
  files,
  highlightIndex,
}: {
  header: string;
  files: { icon: string; name: string; sub: string }[];
  highlightIndex: number;
}) {
  return (
    <div className="flex h-full flex-col pt-11" style={{ background: '#16171a' }}>
      <p className="px-3.5 pb-2.5 text-[12px] font-bold text-white">{header}</p>
      {files.map((f, i) => (
        <div
          key={f.name}
          className={`relative flex items-center gap-2.5 border-b border-white/[0.06] px-3.5 py-2.5 ${
            i === highlightIndex ? 'bg-amber-200/10' : ''
          }`}
        >
          <span className="text-[18px]">{f.icon}</span>
          <div className="min-w-0 flex-1 text-end">
            <p className={`truncate text-[11px] font-semibold ${i === highlightIndex ? 'text-amber-200' : 'text-white'}`}>
              {f.name}
            </p>
            <p className="mt-0.5 truncate text-[9.5px] text-white/40">{f.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Renders whichever screen a guide step describes. The sole export of this
 * module (all the screen pieces above are internal) so it reads as a normal
 * component for Fast Refresh, even though it dispatches on `step.kind`. */
export function GuideStepView({ step, ctx }: { step: GuideStep; ctx: ContactContext }) {
  switch (step.kind) {
    case 'chat':
      return <ChatScreen {...ctx} highlight={step.highlight} />;
    case 'menu':
      return (
        <OverlayScreen name={ctx.contactName} sub={ctx.contactSub}>
          <MenuPanel items={step.items} highlightIndex={step.highlightIndex} />
        </OverlayScreen>
      );
    case 'dialog':
      return (
        <OverlayScreen name={ctx.contactName} sub={ctx.contactSub}>
          <DialogPanel question={step.question} options={step.options} highlightIndex={step.highlightIndex} />
        </OverlayScreen>
      );
    case 'share':
      return (
        <OverlayScreen name={ctx.contactName} sub={ctx.contactSub} scrim="bg-black/70">
          <SharePanel apps={step.apps} highlightIndex={step.highlightIndex} />
        </OverlayScreen>
      );
    case 'appUpload':
      return <AppUploadScreen title={step.title} subtitle={step.subtitle} />;
    case 'filePicker':
      return <FilePickerScreen header={step.header} files={step.files} highlightIndex={step.highlightIndex} />;
  }
}
