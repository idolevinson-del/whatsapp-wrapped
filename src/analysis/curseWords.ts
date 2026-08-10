// Common curse/profanity words for the "Potty Mouth" stat. Checked against
// every chat regardless of the app's UI language — the chat's own language
// has nothing to do with which language the visitor reads the app in (see
// containsLaugh in textUtils.ts for the same reasoning). Not exhaustive by
// design, same philosophy as stopwords.ts: the well-known, commonly-used
// words in each language, not slurs targeting a group — this is a "who
// swears the most" fun stat, not a moderation tool.
export const CURSE_WORDS = new Set([
  // English
  'fuck', 'fucking', 'fucked', 'fucker', 'fuckin', 'motherfucker',
  'shit', 'shitty', 'bullshit', 'bitch', 'bastard', 'asshole', 'dick',
  'dickhead', 'prick', 'cunt', 'twat', 'piss', 'pissed', 'damn', 'goddamn',
  'crap', 'douchebag', 'douche', 'slut', 'whore', 'wanker', 'bollocks',
  'bloody', 'arse', 'jackass',

  // Hebrew
  'זין', 'מזדיין', 'מזדיינת', 'כוס', 'כוסאמק', 'קוסאמק', 'חרא', 'מניאק',
  'מניאקית', 'שרמוטה', 'זונה', 'לעזאזל', 'תזדיין', 'דביל', 'דבילה',
  'מטומטם', 'מטומטמת', 'אידיוט', 'אידיוטית', 'טמבל', 'טמבלית', 'פאק',

  // Arabic
  'كس', 'خرا', 'قحبة', 'منيك', 'حقير', 'غبي', 'احمق', 'تبا', 'يلعن',

  // Spanish
  'mierda', 'joder', 'cabrón', 'cabrona', 'puta', 'puto', 'pendejo',
  'pendeja', 'coño', 'hostia', 'gilipollas', 'imbécil', 'idiota',
  'maricón', 'verga', 'culero', 'chingada', 'chingar', 'pinche',

  // Portuguese
  'merda', 'porra', 'caralho', 'foda', 'fodase', 'cacete', 'desgraçado',
  'desgraçada', 'otário', 'otária', 'imbecil', 'corno', 'vagabundo',
  'vagabunda', 'bosta', 'cuzão',

  // French
  'merde', 'putain', 'connard', 'connasse', 'salope', 'enculé', 'enculée',
  'bordel', 'chiant', 'chiante', 'connerie', 'foutre', 'bâtard', 'salaud',
  'crétin', 'débile',
]);
