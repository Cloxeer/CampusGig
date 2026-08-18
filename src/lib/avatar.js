import { supabase } from "./supabase";

export async function uploadAvatar(file) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { path: null, error: { message: "Not authenticated" } };

  /* TEMP DIAGNOSTIC — remove after we solve the avatar 400/RLS issue.
     Prints what the *server* will actually see: the JWT's `sub` (which
     becomes auth.uid()) and `role`, vs. the folder we're writing to. */
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    const claims = token
      ? JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")))
      : null;
    console.log("[avatar diag] getUser().id  =", user.id);
    console.log("[avatar diag] token present =", Boolean(token));
    console.log("[avatar diag] token.sub     =", claims?.sub);
    console.log("[avatar diag] token.role    =", claims?.role);
    console.log("[avatar diag] token.exp     =", claims?.exp, claims?.exp ? new Date(claims.exp * 1000).toISOString() : "");
    console.log("[avatar diag] sub === id    =", claims?.sub === user.id);
    console.log("[avatar diag] file.type     =", file.type, "size =", file.size);
  } catch (e) {
    console.log("[avatar diag] failed to decode token", e);
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) return { path: null, error: uploadError };

  const { error: updateError } = await supabase
    .from("users")
    .update({ avatar_url: path })
    .eq("id", user.id);

  return { path, error: updateError };
}

export function getAvatarUrl(avatarPath) {
  if (!avatarPath) return null;
  const { data } = supabase.storage.from("avatars").getPublicUrl(avatarPath);
  return data?.publicUrl || null;
}
