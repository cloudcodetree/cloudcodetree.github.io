// Public auth configuration — committed by design, like the Web3Forms access
// key: the Supabase URL and publishable (anon) key ship in every built page;
// enforcement lives in RLS and the Worker gate, never in hiding these.
export const SUPABASE_URL = 'https://tgcysgioncdmtzcfknix.supabase.co';
export const SUPABASE_ANON_KEY =
  'sb_publishable_xElUD5_ZTjOVM8ZHSZ1lQw_Zq5gto2o';
// Flip when the Google provider is configured in Supabase (Phase 2 Task 0.4).
export const GOOGLE_ENABLED = false;
