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
  // Greetings and filler words — generic, not "what you actually talk about".
  'hi', 'hey', 'hello', 'bye', 'maybe', 'like', 'ok', 'okay', 'yeah', 'yep',
  'nope', 'well', 'um', 'uh', 'oh', 'lol',
  // Contractions, apostrophe stripped (see isStopword) — grammar, not content.
  'cant', 'wont', 'didnt', 'isnt', 'wasnt', 'arent', 'werent', 'wouldnt',
  'couldnt', 'shouldnt', 'hasnt', 'havent', 'hadnt', 'thats', 'theres',
  'hes', 'shes', 'theyre', 'weve', 'youve', 'theyve', 'ill', 'youll',
  'theyll', 'id', 'youd',
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
  // Greetings and filler words — generic, not "what you actually talk about".
  'היי', 'שלום', 'ביי', 'אולי', 'סתם', 'כאילו', 'וואלה', 'יאללה', 'אה', 'אוקי', 'זהו',
]);

export function isStopword(word: string): boolean {
  const lower = word.toLowerCase();
  // Word extraction keeps apostrophes (so contractions read naturally), but
  // the English list stores them stripped ('dont', 'cant', ...) — compare
  // both forms so "don't"/"can't" actually match.
  const strippedOfApostrophes = lower.replace(/'/g, '');
  return (
    ENGLISH_STOPWORDS.has(lower) ||
    ENGLISH_STOPWORDS.has(strippedOfApostrophes) ||
    HEBREW_STOPWORDS.has(word)
  );
}
