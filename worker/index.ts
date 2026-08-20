/// <reference types="@cloudflare/workers-types" />

export interface Env {
  ASSETS: Fetcher;
  /** Canonical production hostname. Any other hostname is a staging origin. */
  PRODUCTION_HOSTNAME: string;
}

/**
 * Phase 0: pass-through.
 *
 * This handler runs for only two kinds of request:
 *   1. paths matched by `run_worker_first` - the /api and per-demo routes -
 *      which have no assets behind them until Phase 2 and so 404 for now;
 *   2. requests matching no static asset, where deferring to ASSETS applies
 *      `not_found_handling: "404-page"` and returns public/404.html.
 *
 * Every ordinary page is served at the edge without invoking this code.
 */
export default {
  fetch(request: Request, env: Env): Promise<Response> {
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
