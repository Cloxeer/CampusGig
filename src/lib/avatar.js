import { supabase } from "./supabase";
import { prepareAvatarImage } from "../utils/prepareAvatarImage";
import { setSelfAvatarUrl } from "./selfAvatar";

export async function uploadAvatar(file) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { path: null, error: { message: "Not authenticated" } };

  let jpeg;
  try {
    jpeg = await prepareAvatarImage(file);
  } catch (e) {
    return { path: null, error: { message: e.message || "Could not read that photo." } };
  }

  /* Storage's HTTP service currently ignores valid user JWTs (Auth + PostgREST
     accept the same token). Upload via Edge Function: Auth getUser() + service role. */
  const form = new FormData();
  form.append("file", jpeg);

  const { data: fnData, error: fnError } = await supabase.functions.invoke(
    "upload-avatar",
    { body: form },
  );

  if (fnError) return { path: null, error: fnError };
  if (fnData?.error) return { path: null, error: { message: fnData.error } };
  const path = fnData?.path;
  if (!path) return { path: null, error: { message: "Photo upload failed" } };

  /* Same object key on every save — stamp a cache token so every screen that
     reads avatar_url gets a new public URL (otherwise the old JPEG stays cached). */
  const versionedPath = `${String(path).split("?")[0]}?v=${Date.now()}`;

  /* Optimistic: publish the new URL to the self-avatar registry NOW so every
     mounted surface that draws your avatar (profile header, the leaderboard's
     "you" row, gig cards) repaints immediately — no refetch, no per-screen
     staleness. `getAvatarUrl` resolves the object path + carries the cache token. */
  setSelfAvatarUrl(getAvatarUrl(versionedPath));

  const { error: updateError } = await supabase
    .from("users")
    .update({ avatar_url: versionedPath })
    .eq("id", user.id);

  return { path: versionedPath, error: updateError };
}

export function getAvatarUrl(avatarPath) {
  if (!avatarPath) return null;
  const q = String(avatarPath).indexOf("?");
  const objectPath = q === -1 ? avatarPath : avatarPath.slice(0, q);
  const cacheQuery = q === -1 ? "" : avatarPath.slice(q + 1);
  const { data } = supabase.storage.from("avatars").getPublicUrl(objectPath);
  if (!data?.publicUrl) return null;
  if (!cacheQuery) return data.publicUrl;
  const join = data.publicUrl.includes("?") ? "&" : "?";
  return `${data.publicUrl}${join}${cacheQuery}`;
}
