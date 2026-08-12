/**
 * Master on/off switch for the whole Wrapped+ paywall. Flip to `true` to
 * bring premium back — see isPremium() in lib/premium.ts, which is the
 * single place this actually takes effect: everything else (locked
 * StatsPage/SharedStatsPage blocks, the free upload-count cap, the share-
 * bonus hint, the "🔓 Wrapped+" entry link on the upload page) already
 * derives from isPremium() or userIsPremium, so this one flag is the whole
 * revert — nothing else needs to change.
 */
export const PREMIUM_ENABLED = false;

/** The product's public Gumroad page. */
export const CHECKOUT_URL = 'https://levinspire7.gumroad.com/l/chat-wrapped';

/** The product's ID (shown in the dashboard's License key block, under
 * "Use your product ID to verify licenses through the API") — required by
 * the License Verification API to scope a key to this product. */
export const GUMROAD_PRODUCT_ID = 'fYP8W-YUedsE0gKS7yV75A==';
