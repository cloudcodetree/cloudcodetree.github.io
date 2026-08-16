/**
 * feed-window.mjs — the single definition of how big content/feed.xml may get.
 *
 * Imported by scripts/trim-feed.mjs (which enforces it) and scripts/validate-blog.mjs
 * (which warns when it has drifted). Kept in one place so the trimmer and the guard
 * can never disagree about the window.
 *
 * See docs/ai-news-feed-contract.md → "The feed is a rolling window, NOT the archive".
 */

/** Items kept in the feed: ~2 weeks at the current ~8 posts/day. */
export const FEED_WINDOW = 120;

/**
 * How far past the window the feed may drift before validate-blog complains.
 * Deliberately loose: a couple of un-trimmed runs is normal and not worth noise,
 * but sustained growth means trim-feed.mjs has stopped running.
 */
export const FEED_WINDOW_SLACK = 1.5;

/** Item count at or above which the feed is considered un-trimmed. */
export const FEED_WINDOW_LIMIT = Math.ceil(FEED_WINDOW * FEED_WINDOW_SLACK);
