const MAX_EDGE = 1080;
const JPEG_QUALITY = 0.85;
const IMAGE_NAME = /\.(jpe?g|png|gif|webp|heic|heif)$/i;

/**
 * True for camera-roll photos, including iPhone HEIC and files with an empty MIME.
 */
export function looksLikeAvatarImage(file) {
  if (!file) return false;
  const type = String(file.type || "").toLowerCase();
  if (type.startsWith("image/")) return true;
  return IMAGE_NAME.test(file.name || "");
}

async function decodeImage(file) {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      /* Fall through — some desktops cannot decode HEIC; iOS Safari can. */
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not read that photo."));
      el.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Instagram-style: any phone photo (HEIC, huge 48MP JPEG, etc.) becomes a
 * small square-ish JPEG the avatars bucket actually accepts.
 */
export async function prepareAvatarImage(file) {
  if (!looksLikeAvatarImage(file)) {
    throw new Error("Please select a photo.");
  }
  if (file.size > 40 * 1024 * 1024) {
    throw new Error("That photo is too large. Try a smaller one.");
  }

  const source = await decodeImage(file);
  const srcW = source.width;
  const srcH = source.height;
  if (!srcW || !srcH) {
    throw new Error("Could not read that photo.");
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(srcW, srcH));
  const width = Math.max(1, Math.round(srcW * scale));
  const height = Math.max(1, Math.round(srcH * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process that photo.");
  ctx.drawImage(source, 0, 0, width, height);
  if (typeof source.close === "function") source.close();

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (next) => (next ? resolve(next) : reject(new Error("Could not process that photo."))),
      "image/jpeg",
      JPEG_QUALITY,
    );
  });

  return new File([blob], "avatar.jpg", { type: "image/jpeg" });
}
