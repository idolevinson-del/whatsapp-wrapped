import type { GuideStep } from './types';
import type { Language } from '../../i18n';

interface GuideContent {
  contactName: string;
  contactSub: string;
  messages: { text: string; time: string; out?: boolean }[];
  steps: GuideStep[];
  captions: string[];
}

const FILES_EN = [
  { icon: '🖼️', name: 'IMG_0231.jpg', sub: '2.1MB' },
  { icon: '🗂️', name: 'WhatsApp Chat - Dana.zip', sub: '48KB · Today' },
  { icon: '📄', name: 'Receipt.pdf', sub: '110KB' },
];
const FILES_HE = [
  { icon: '🖼️', name: 'IMG_0231.jpg', sub: '2.1MB' },
  { icon: '🗂️', name: 'WhatsApp Chat - דנה.zip', sub: '48KB · היום' },
  { icon: '📄', name: 'קבלה.pdf', sub: '110KB' },
];

const MESSAGES_EN = [
  { text: 'When are we heading out?', time: '9:14 PM' },
  { text: '5:30 at the station 👍', time: '9:16 PM', out: true },
  { text: 'Perfect, see you there!', time: '9:17 PM' },
];
const MESSAGES_HE = [
  { text: 'מתי יוצאים?', time: '21:14' },
  { text: '17:30 בתחנה 👍', time: '21:16', out: true },
  { text: 'מעולה, נתראה!', time: '21:17' },
];

/**
 * Step data behind the illustrated export guide, per language and platform.
 * Android and iPhone genuinely differ here (Android: 3-dot menu -> "More" ->
 * "Export chat"; iPhone: tap the contact name -> scroll -> "Export Chat"
 * directly, no "More" level) — not just relabeled, the step count differs.
 */
type GuideContentByPlatform = Record<'android' | 'iphone', GuideContent>;

// Only 'en' and 'he' have full illustrated content today (see
// ExportGuidePage.tsx, which falls back to 'en' for every other language) —
// those two are required, the rest are optional so TypeScript enforces
// handling the missing case instead of silently indexing into undefined,
// while `.en` itself stays guaranteed non-optional for the fallback.
export const EXPORT_GUIDE_CONTENT: Record<'en' | 'he', GuideContentByPlatform> &
  Partial<Record<Exclude<Language, 'en' | 'he'>, GuideContentByPlatform>> = {
  en: {
    android: {
      contactName: 'Dana',
      contactSub: 'last seen today at 9:40 PM',
      messages: MESSAGES_EN,
      steps: [
        { kind: 'chat', highlight: 'menu' },
        {
          kind: 'menu',
          items: ['View contact', 'Media, links, and docs', 'Search', 'Mute notifications', 'Wallpaper', 'More'],
          highlightIndex: 5,
        },
        { kind: 'menu', items: ['Export chat', 'Add shortcut', 'Clear chat'], highlightIndex: 0 },
        {
          kind: 'dialog',
          question: 'Include media in the export?',
          options: ['Without Media', 'Include Media'],
          highlightIndex: 0,
        },
        {
          kind: 'share',
          apps: [
            { icon: '✉️', label: 'Gmail' },
            { icon: '📁', label: 'Files' },
            { icon: '☁️', label: 'Drive' },
            { icon: '⋯', label: 'More' },
          ],
          highlightIndex: 1,
        },
        { kind: 'appUpload', title: 'Upload your chat file', subtitle: 'Tap to choose it from Files' },
        { kind: 'filePicker', header: 'Files · Downloads', files: FILES_EN, highlightIndex: 1 },
      ],
      captions: [
        'Open the chat you want to export, then tap the three-dot menu',
        'In the menu that opens, tap "More"',
        'Then tap "Export chat"',
        'Choose "Without Media" — a much faster export',
        'In the share sheet that opens, choose to save to "Files"',
        'Come back here, and tap the upload area',
        'Choose the chat file from "Files"',
      ],
    },
    iphone: {
      contactName: 'Dana',
      contactSub: 'last seen today at 9:40 PM',
      messages: MESSAGES_EN,
      steps: [
        { kind: 'chat', highlight: 'name' },
        {
          kind: 'menu',
          items: ['Media, Links, and Docs', 'Starred Messages', 'Mute', 'Wallpaper & Sound', 'Chat Lock', 'Export Chat'],
          highlightIndex: 5,
        },
        {
          kind: 'dialog',
          question: 'Include media in the export?',
          options: ['Without Media', 'Include Media'],
          highlightIndex: 0,
        },
        {
          kind: 'share',
          apps: [
            { icon: '💬', label: 'Messages' },
            { icon: '📁', label: 'Save to Files' },
            { icon: '✉️', label: 'Mail' },
            { icon: '⋯', label: 'More' },
          ],
          highlightIndex: 1,
        },
        { kind: 'appUpload', title: 'Upload your chat file', subtitle: 'Tap to choose it from Files' },
        { kind: 'filePicker', header: 'Files · Downloads', files: FILES_EN, highlightIndex: 1 },
      ],
      captions: [
        'Tap the contact or group name at the top of the chat',
        'Scroll down and tap "Export Chat"',
        'Choose "Without Media" — a much faster export',
        'Tap "Save to Files"',
        'Come back here, and tap the upload area',
        'Choose the chat file from "Files"',
      ],
    },
  },
  he: {
    android: {
      contactName: 'דנה',
      contactSub: 'לאחרונה מקוונ/ת היום ב-21:40',
      messages: MESSAGES_HE,
      steps: [
        { kind: 'chat', highlight: 'menu' },
        {
          kind: 'menu',
          items: ['פרטי איש קשר', 'מדיה, קישורים ומסמכים', 'חיפוש', 'השתקת התראות', 'טפט', 'עוד'],
          highlightIndex: 5,
        },
        { kind: 'menu', items: ['ייצוא צ׳אט', 'הוספת קיצור דרך', 'ניקוי צ׳אט'], highlightIndex: 0 },
        {
          kind: 'dialog',
          question: 'לכלול מדיה בייצוא?',
          options: ['ללא מדיה', 'כלול מדיה'],
          highlightIndex: 0,
        },
        {
          kind: 'share',
          apps: [
            { icon: '✉️', label: 'Gmail' },
            { icon: '📁', label: 'קבצים' },
            { icon: '☁️', label: 'Drive' },
            { icon: '⋯', label: 'עוד' },
          ],
          highlightIndex: 1,
        },
        { kind: 'appUpload', title: 'העלו את קובץ הצ׳אט', subtitle: 'לחצו כדי לבחור מ״קבצים״' },
        { kind: 'filePicker', header: 'קבצים · הורדות', files: FILES_HE, highlightIndex: 1 },
      ],
      captions: [
        'פתחו את הצ׳אט שרוצים לייצא, והקישו על שלוש הנקודות',
        'בתפריט שנפתח, הקישו על ״עוד״',
        'ואז על ״ייצוא צ׳אט״',
        'בחרו ״ללא מדיה״ — ייצוא מהיר בהרבה',
        'בחלון השיתוף שנפתח, בחרו לשמור אל ״קבצים״',
        'חזרו לכאן, והקישו על אזור ההעלאה',
        'ובחרו את קובץ הצ׳אט מתוך ״קבצים״',
      ],
    },
    iphone: {
      contactName: 'דנה',
      contactSub: 'לאחרונה מקוונ/ת היום ב-21:40',
      messages: MESSAGES_HE,
      steps: [
        { kind: 'chat', highlight: 'name' },
        {
          kind: 'menu',
          items: ['מדיה, קישורים ומסמכים', 'הודעות מסומנות בכוכב', 'השתקה', 'טפט וצליל', 'נעילת צ׳אט', 'ייצוא צ׳אט'],
          highlightIndex: 5,
        },
        {
          kind: 'dialog',
          question: 'לכלול מדיה בייצוא?',
          options: ['ללא מדיה', 'כלול מדיה'],
          highlightIndex: 0,
        },
        {
          kind: 'share',
          apps: [
            { icon: '💬', label: 'הודעות' },
            { icon: '📁', label: 'שמירה בקבצים' },
            { icon: '✉️', label: 'מייל' },
            { icon: '⋯', label: 'עוד' },
          ],
          highlightIndex: 1,
        },
        { kind: 'appUpload', title: 'העלו את קובץ הצ׳אט', subtitle: 'לחצו כדי לבחור מ״קבצים״' },
        { kind: 'filePicker', header: 'קבצים · הורדות', files: FILES_HE, highlightIndex: 1 },
      ],
      captions: [
        'הקישו על שם איש הקשר או הקבוצה בראש הצ׳אט',
        'גללו למטה והקישו על ״ייצוא צ׳אט״',
        'בחרו ״ללא מדיה״ — ייצוא מהיר בהרבה',
        'הקישו על ״שמירה בקבצים״',
        'חזרו לכאן, והקישו על אזור ההעלאה',
        'ובחרו את קובץ הצ׳אט מתוך ״קבצים״',
      ],
    },
  },
};
