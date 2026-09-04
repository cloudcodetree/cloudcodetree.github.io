/**
 * feed-window.mjs — the single definition of how big content/feed.xml may get.
 *
 * Imported by scripts/trim-feed.mjs (which enforces it) and scripts/validate-blog.mjs
 * (which warns when it has drifted). Kept in one place so the trimmer and the guard
 * can never disagree about the window.
 *
 * See docs/ai-news-feed-contract.md → "The feed is a rolling window, NOT the archive".
 */

/**
 * Items kept in the feed: ~15 days at the target 8 posts/day.
 *
 * Sized for DEDUP COVERAGE, deliberately not for a single file read. At ~3.6 KB
 * per item the window is ~437 KB, which exceeds the 256 KB Read-tool limit — a
 * real run hit exactly that and fell back to grep / XML queries, which worked
 * fine and burns far less context than reading the whole file anyway.
 *
 * Do not "fix" that by shrinking this number. Only ~70 items fit a single read,
 * which is ~8.8 days — less than the contract's ~10-day freshness guard, so a
 * feed small enough to read whole is too small to dedup against. Coverage wins;
 * the contract tells the routine to query the feed rather than read it.
 */
export const FEED_WINDOW = 120;

/**
 * How far past the window the feed may drift before validate-blog complains.
 * Deliberately loose: a couple of un-trimmed runs is normal and not worth noise,
 * but sustained growth means trim-feed.mjs has stopped running.
 */
export const FEED_WINDOW_SLACK = 1.5;

/** Item count at or above which the feed is considered un-trimmed. */
export const FEED_WINDOW_LIMIT = Math.ceil(FEED_WINDOW * FEED_WINDOW_SLACK);
