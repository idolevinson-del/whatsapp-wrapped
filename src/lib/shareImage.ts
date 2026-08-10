/**
 * Renders a shareable summary card as a PNG — the thing people actually post
 * to a WhatsApp status or Instagram story, as opposed to a text message with
 * a link. Story-ratio (1080×1920) so it drops straight into either surface
 * without cropping.
 *
 * Pure canvas, no dependencies: this only needs to run once per share tap,
 * so there's no reason to ship a rendering library for it.
 */

const WIDTH = 1080;
const HEIGHT = 1920;

export interface ShareImageData {
  appTitle: string;
  /** The three gradient stops, matching the app's brand colors. */
  gradient: [string, string, string];
  totalMessages: number;
  totalMessagesLabel: string;
  spanDays: number;
  spanLabel: string;
  topSenderName?: string;
  topSenderCount?: number;
  topSenderLabel: string;
  topStreakName?: string;
  topStreakDays?: number;
  topStreakLabel: string;
  busiestDayDate: string;
  busiestDayCount: number;
  busiestDayLabel: string;
  busiestDayCountLabel: string;
  ctaText: string;
  urlText: string;
  dir: 'ltr' | 'rtl';
  /** The chat's single most shareable "you are the ___" badge, e.g. "🦉" +
   * "Alex is the Comedian — made others laugh 12 times." Optional: not
   * every payload this renders from has enough data to derive one (see
   * SharedStatsPage), and the image still works fine without it. */
  personaIcon?: string;
  personaText?: string;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawBackground(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const glow = ctx.createRadialGradient(WIDTH * 0.75, HEIGHT * 0.12, 0, WIDTH * 0.75, HEIGHT * 0.12, WIDTH * 0.7);
  glow.addColorStop(0, 'rgba(192,132,252,0.16)');
  glow.addColorStop(0.5, 'rgba(251,191,36,0.08)');
  glow.addColorStop(1, 'rgba(10,10,15,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = 'rgba(255,255,255,0.045)';
  const spacing = 34;
  for (let x = spacing / 2; x < WIDTH; x += spacing) {
    for (let y = spacing / 2; y < HEIGHT; y += spacing) {
      ctx.beginPath();
      ctx.arc(x, y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function gradientText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  font: string,
  align: CanvasTextAlign,
  approxWidth: number,
  gradient: [string, string, string]
) {
  ctx.font = font;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  const grad = ctx.createLinearGradient(x - approxWidth / 2, 0, x + approxWidth / 2, 0);
  grad.addColorStop(0, gradient[0]);
  grad.addColorStop(0.5, gradient[1]);
  grad.addColorStop(1, gradient[2]);
  ctx.fillStyle = grad;
  ctx.fillText(text, x, y);
}

/** Greedy word-wrap using actual glyph widths (canvas has no CSS-style
 * auto-wrap) — `ctx.font` must already be set to the font this measures in.
 * Space-delimited splitting works fine for both English and Hebrew here. */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && ctx.measureText(candidate).width > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * The "you are the ___" persona badge — icon plus the full formatted
 * sentence, gradient-styled like the headline number so it reads as the
 * image's second hero moment, not just another stat row. Returns the y just
 * below what it drew, so the caller can keep laying out from there.
 */
function drawPersonaHero(
  ctx: CanvasRenderingContext2D,
  y: number,
  icon: string,
  text: string,
  dir: 'ltr' | 'rtl',
  gradient: [string, string, string]
): number {
  const centerX = WIDTH / 2;
  const maxWidth = 880;

  ctx.direction = dir;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = '110px system-ui, -apple-system, "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#fff';
  ctx.fillText(icon, centerX, y + 90);

  const fontSize = 54;
  const lineHeight = fontSize + 20;
  const font = `800 ${fontSize}px system-ui, -apple-system, "Segoe UI", Arial, sans-serif`;
  ctx.font = font; // needed before measureText() inside wrapText
  const lines = wrapText(ctx, text, maxWidth).slice(0, 2); // hard cap so an unusually long name can't run off-canvas

  let ly = y + 180;
  for (const line of lines) {
    gradientText(ctx, line, centerX, ly, font, 'center', maxWidth, gradient);
    ly += lineHeight;
  }
  return ly;
}

/** A highlight card: icon + big value + label, used for the top-sender and busiest-day rows. */
function drawHighlightCard(
  ctx: CanvasRenderingContext2D,
  y: number,
  height: number,
  icon: string,
  value: string,
  label: string,
  dir: 'ltr' | 'rtl'
) {
  const x = 72;
  const w = WIDTH - x * 2;
  ctx.save();
  ctx.direction = dir;
  roundRect(ctx, x, y, w, height, 32);
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  ctx.stroke();

  const iconX = dir === 'rtl' ? x + w - 56 : x + 56;
  ctx.textAlign = 'center';
  ctx.font = '64px system-ui, -apple-system, "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'middle';
  ctx.fillText(icon, iconX, y + height / 2);

  const textX = dir === 'rtl' ? x + w - 132 : x + 132;
  ctx.textAlign = dir === 'rtl' ? 'right' : 'left';
  ctx.font = '700 46px system-ui, -apple-system, "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#f5f5f5';
  ctx.fillText(value, textX, y + height / 2 - 24);
  ctx.font = '400 32px system-ui, -apple-system, "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#a3a3a3';
  ctx.fillText(label, textX, y + height / 2 + 30);
  ctx.restore();
}

export async function generateShareImageBlob(data: ShareImageData): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  ctx.direction = data.dir;
  drawBackground(ctx);

  const centerX = WIDTH / 2;

  // Brand row
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = '600 40px system-ui, -apple-system, "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#d4d4d4';
  ctx.fillText(`💬 ${data.appTitle}`, centerX, 190);

  // Headline number
  gradientText(
    ctx,
    String(data.totalMessages),
    centerX,
    420,
    '800 200px system-ui, -apple-system, "Segoe UI", Arial, sans-serif',
    'center',
    900,
    data.gradient
  );
  ctx.font = '500 44px system-ui, -apple-system, "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#e5e5e5';
  ctx.fillText(data.totalMessagesLabel, centerX, 480);

  ctx.font = '400 34px system-ui, -apple-system, "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#a3a3a3';
  ctx.fillText(data.spanLabel, centerX, 540);

  // Highlight cards
  let y = 640;
  if (data.topSenderName) {
    drawHighlightCard(
      ctx,
      y,
      190,
      '🏆',
      `${data.topSenderName} — ${data.topSenderCount}`,
      data.topSenderLabel,
      data.dir
    );
    y += 216;
  }
  drawHighlightCard(
    ctx,
    y,
    190,
    '💥',
    `${data.busiestDayDate} · ${data.busiestDayCount}`,
    `${data.busiestDayLabel} (${data.busiestDayCountLabel})`,
    data.dir
  );
  y += 216;
  if (data.topStreakName && data.topStreakDays) {
    drawHighlightCard(
      ctx,
      y,
      190,
      '🔥',
      `${data.topStreakName} — ${data.topStreakDays}`,
      data.topStreakLabel,
      data.dir
    );
    y += 216;
  }

  // Persona hero — "you are the ___" — in the gap between the highlight
  // cards and the fixed-position footer below. Sized to fit that gap even
  // in the worst case (all 3 cards + a wrapped 2-line persona sentence).
  if (data.personaIcon && data.personaText) {
    drawPersonaHero(ctx, y + 30, data.personaIcon, data.personaText, data.dir, data.gradient);
  }

  // Footer: CTA + URL
  ctx.textAlign = 'center';
  ctx.font = '700 44px system-ui, -apple-system, "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#fff';
  ctx.fillText(data.ctaText, centerX, HEIGHT - 200);

  roundRect(ctx, centerX - 320, HEIGHT - 150, 640, 84, 42);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.font = '600 32px system-ui, -apple-system, "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#e5e5e5';
  ctx.direction = 'ltr'; // URL text is always LTR regardless of app language
  ctx.fillText(data.urlText, centerX, HEIGHT - 96);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))), 'image/png');
  });
}

/**
 * On mobile, hands the image to the native share sheet (so it can go
 * straight to a WhatsApp status or Instagram story). Falls back to a plain
 * download wherever file sharing isn't supported (most desktop browsers).
 */
export async function shareOrDownloadImage(blob: Blob, filename: string, shareTitle: string, shareText: string) {
  const file = new File([blob], filename, { type: 'image/png' });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: shareTitle, text: shareText });
      return;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return; // user cancelled — don't also download
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
