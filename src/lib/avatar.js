import { supabase } from "./supabase";

export async function uploadAvatar(file) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { path: null, error: { message: "Not authenticated" } };

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
