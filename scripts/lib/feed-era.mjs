/**
 * feed-era.mjs — which posts the tag rules apply to.
 *
 * The feed era is every post published on or after the 2026-06-09 cutover to the
 * RSS pipeline. Before that sits the 150-post back-catalogue from the retired
 * Desktop importer: frozen history no current tool regenerates, so re-tagging it
 * would mean inventing metadata.
 *
 * A DATE cutoff, deliberately not "is it in content/feed.xml". Feed membership was
 * equivalent until trim-feed.mjs started keeping the feed to a rolling window —
 * after that, membership silently shrinks to the last ~15 days, which would drop
 * older posts out of both enforcement (validate-blog) and repair (normalize-tags).
 * That exact bug bit once: a merge reverted 50 posts' tags and normalize-tags
 * refused to fix them because they were no longer in the feed.
 *
 * Shared by scripts/validate-blog.mjs and scripts/normalize-tags.mjs so the rule
 * that FINDS a problem and the rule that FIXES it can never disagree about scope.
 */

/** 2026-06-09, the RSS cutover. */
export const FEED_ERA_START = Date.UTC(2026, 5, 9);

/**
 * True if a posts.json entry is in the feed era (and so subject to the tag rules).
 * A malformed date returns true: that is already a validation error in its own
 * right, and should not also buy the post an exemption.
 */
export function isFeedEra(post) {
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(post?.date ?? '');
  if (!m) return true;
  const [, mm, dd, yyyy] = m;
  return Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd)) >= FEED_ERA_START;
}
