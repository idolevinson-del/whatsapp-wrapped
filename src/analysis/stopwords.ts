// Common stopwords excluded from "top words" stats. Not exhaustive by
// design - tune from real data per AGENTS.md rather than over-engineering
// up front.
export const ENGLISH_STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'to', 'of',
  'in', 'on', 'at', 'for', 'with', 'this', 'that', 'it', 'i', 'you', 'he',
  'she', 'we', 'they', 'not', 'no', 'yes', 'what', 'how', 'why', 'if', 'so',
  'just', 'do', 'did', 'have', 'has', 'had', 'be', 'been', 'my', 'your',
  'his', 'her', 'our', 'their', 'me', 'him', 'us', 'them', 'as', 'by', 'from',
  'up', 'out', 'about', 'into', 'than', 'then', 'there', 'here', 'all', 'can',
  'will', 'would', 'could', 'should', 'im', 'its', 'dont', 'youre',
]);

export const HEBREW_STOPWORDS = new Set([
  'את', 'של', 'עם', 'על', 'זה', 'זאת', 'אני', 'אתה', 'את', 'הוא', 'היא',
  'אנחנו', 'אתם', 'אתן', 'הם', 'הן', 'גם', 'לא', 'כן', 'מה', 'איך', 'למה',
  'כי', 'אבל', 'או', 'אם', 'כל', 'יש', 'אין', 'היה', 'היתה', 'היו', 'להיות',
  'אז', 'רק', 'עוד', 'כבר', 'פה', 'שם', 'הזה', 'הזאת', 'אלה', 'אלו', 'וזה',
  'אל', 'וגם', 'וכן', 'מאוד', 'יותר', 'פחות', 'ככה', 'קצת', 'הרבה', 'שוב',
  'אחד', 'אחת', 'שתי', 'שני', 'אותו', 'אותה', 'אותם', 'אותך', 'אותי', 'לי',
  'לך', 'לו', 'לה', 'לנו', 'להם', 'בו', 'בה', 'בי', 'בך', 'בהם', 'מי', 'מתי',
  'איפה', 'כמה', 'נו', 'אוקיי', 'בסדר', 'טוב',
]);

export function isStopword(word: string): boolean {
  const lower = word.toLowerCase();
  return ENGLISH_STOPWORDS.has(lower) || HEBREW_STOPWORDS.has(word);
}
