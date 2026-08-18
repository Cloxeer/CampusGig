import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing Supabase environment variables. " +
      "Set VITE_SUPABASE_URL and either VITE_SUPABASE_ANON_KEY or VITE_SUPABASE_PUBLISHABLE_KEY " +
      "(see .env.example)."
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Magic links are frequently opened in a different browser/app than the one
    // that requested them (email client webviews, desktop→browser handoff). PKCE
    // stores a per-browser code_verifier, so those cross-context opens fail with
    // "?code=… but still logged out". The implicit flow returns the session in the
    // URL fragment and completes in any browser — the right trade-off for email links.
    flowType: "implicit",
  },
});
