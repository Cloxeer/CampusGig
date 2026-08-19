import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-file-name",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
]);
const MAX_BYTES = 5 * 1024 * 1024;

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }
  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json(401, { error: "Not authenticated" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return json(500, { error: "Server is missing Supabase credentials" });
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();
  if (userError || !user) {
    return json(401, { error: userError?.message || "Not authenticated" });
  }

  let file: File | Blob | null = null;
  let mime = "";

  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const uploaded = form.get("file");
    if (uploaded instanceof File) {
      file = uploaded;
      mime = uploaded.type;
    }
  } else if (contentType.startsWith("image/")) {
    const buf = await req.arrayBuffer();
    mime = contentType.split(";")[0].trim();
    file = new Blob([buf], { type: mime });
  }

  if (!file) return json(400, { error: "Missing image file" });
  if (!ALLOWED_TYPES.has(mime)) {
    return json(400, { error: "Please select a JPEG, PNG, GIF, or WebP image." });
  }
  if (file.size > MAX_BYTES) {
    return json(400, { error: "Image must be under 5 MB." });
  }

  const path = `${user.id}/avatar.jpg`;
  const admin = createClient(supabaseUrl, serviceKey);
  const { error: uploadError } = await admin.storage
    .from("avatars")
    .upload(path, file, {
      upsert: true,
      contentType: "image/jpeg",
      cacheControl: "60",
    });

  if (uploadError) {
    return json(400, { error: uploadError.message, code: uploadError.name });
  }

  return json(200, { path });
});
