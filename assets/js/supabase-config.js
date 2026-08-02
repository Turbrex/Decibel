// Public Supabase project config. The publishable key is safe to expose
// client-side — it only allows what your Row Level Security policies permit.
const SUPABASE_URL = 'https://akkopjukyejzyrxdphef.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_GGiV2RYTbiJGSJmN5EDYLA_tYPiNBwN';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
