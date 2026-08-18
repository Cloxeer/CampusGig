import { supabase } from "./supabase";

/**
 * Cached auth uid, kept fresh via the auth listener — lets presentational
 * components (avatars, badges) cheaply answer "is this row the current user?"
 * without threading session state through every call site.
 */
let uid = null;

supabase.auth.getSession().then(({ data }) => {
  uid = data?.session?.user?.id || null;
});
supabase.auth.onAuthStateChange((_event, session) => {
  uid = session?.user?.id || null;
});

export function getCurrentUid() {
  return uid;
}

export function isSelfId(id) {
  return Boolean(id && uid && String(id) === String(uid));
}
