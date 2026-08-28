import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { escapeHtml, wrapCampusGigEmail } from "./emailShell.ts";

const APP_ORIGIN = (Deno.env.get("APP_ORIGIN") || "https://www.getcampusgig.com").replace(
  /\/$/,
  "",
);
const FROM = Deno.env.get("RESEND_FROM") || "GetCampusGig <noreply@getcampusgig.com>";

type NotifRow = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  metadata: Record<string, unknown> | null;
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function asUuid(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )
    ? value
    : null;
}

function notificationIdFromPayload(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const body = payload as Record<string, unknown>;
  const direct = asUuid(body.notification_id);
  if (direct) return direct;
  const record = body.record;
  if (record && typeof record === "object") {
    return asUuid((record as Record<string, unknown>).id);
  }
  return asUuid(body.id);
}

function shouldEmail(row: NotifRow) {
  const role = typeof row.metadata?.role === "string" ? row.metadata.role : "";
  switch (row.type) {
    case "gig_requested":
      return true;
    case "gig_accepted":
      return role !== "poster";
    case "gig_rejected":
      return true;
    case "gig_completed":
      return true;
    case "review_received":
      return true;
    default:
      return false;
  }
}

function otherPersonId(row: NotifRow) {
  const role = typeof row.metadata?.role === "string" ? row.metadata.role : "";
  const posterId = typeof row.metadata?.poster_id === "string" ? row.metadata.poster_id : "";
  const requesterId =
    typeof row.metadata?.requester_id === "string" ? row.metadata.requester_id : "";
  return role === "poster" ? requesterId : posterId;
}

function ctaFor(row: NotifRow) {
  const gigId = typeof row.metadata?.gig_id === "string" ? row.metadata.gig_id : "";
  const reviewerId =
    typeof row.metadata?.reviewer_id === "string" ? row.metadata.reviewer_id : "";
  const revieweeId = otherPersonId(row);
  switch (row.type) {
    case "gig_requested":
      return { label: "Open gig", url: `${APP_ORIGIN}/gig/${gigId}` };
    case "gig_accepted":
      return { label: "See contact info", url: `${APP_ORIGIN}/gig/${gigId}` };
    case "gig_rejected":
      return { label: "Open alerts", url: `${APP_ORIGIN}/alerts` };
    case "gig_completed":
      return {
        label: "Leave a review",
        url: revieweeId && gigId
          ? `${APP_ORIGIN}/profile/${encodeURIComponent(revieweeId)}?reviews=1&gig=${encodeURIComponent(gigId)}`
          : `${APP_ORIGIN}/gig/${gigId}`,
      };
    case "review_received":
      return {
        label: "View review",
        url: reviewerId
          ? `${APP_ORIGIN}/profile?reviews=1&reviewer=${encodeURIComponent(reviewerId)}`
          : `${APP_ORIGIN}/alerts`,
      };
    default:
      return { label: "Open GetCampusGig", url: APP_ORIGIN };
  }
}

function mailCopy(row: NotifRow) {
  if (row.type === "gig_completed") {
    const other =
      typeof row.metadata?.other_name === "string" && row.metadata.other_name.trim()
        ? row.metadata.other_name.trim()
        : "them";
    const body =
      `Thanks for using GetCampusGig. Please leave a review for ${other} so the next person knows they can trust them.`;
    return {
      subject: "Thank you for using GetCampusGig",
      headline: "Thank you for using GetCampusGig",
      body,
    };
  }
  return {
    subject: row.title || "GetCampusGig",
    headline: row.title || "GetCampusGig",
    body: row.body || "",
  };
}

function buildHtml(row: NotifRow) {
  const copy = mailCopy(row);
  const cta = ctaFor(row);
  const bodyHtml = `${escapeHtml(copy.body).replace(/\n/g, "<br />")}`;
  return wrapCampusGigEmail({
    preheader: copy.body || copy.headline,
    headline: copy.headline,
    bodyHtml,
    ctaLabel: cta.label,
    ctaUrl: cta.url,
    footerNote:
      "Don't see this in your main inbox? Check spam or junk. You can turn Email notifications off in Settings.",
  });
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return json(500, { error: "Server is missing Supabase credentials" });
  }

  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "").trim() || "";
  if (!token) return json(401, { error: "Unauthorized" });

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: allowed, error: authError } = await admin.rpc(
    "_cg_authorize_gig_alert_mail",
    { p_token: token },
  );
  if (authError || allowed !== true) return json(401, { error: "Unauthorized" });

  let payload: unknown = {};
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  const notificationId = notificationIdFromPayload(payload);
  if (!notificationId) return json(400, { error: "Missing notification id" });

  const { data: row, error: rowError } = await admin
    .from("notifications")
    .select("id, user_id, type, title, body, metadata")
    .eq("id", notificationId)
    .maybeSingle();
  if (rowError) return json(500, { error: rowError.message });
  if (!row) return json(200, { skipped: "not_found" });

  const notif = row as NotifRow;
  if (!shouldEmail(notif)) return json(200, { skipped: "type" });

  if (notif.type === "gig_completed") {
    const gigId = typeof notif.metadata?.gig_id === "string" ? notif.metadata.gig_id : null;
    if (gigId) {
      const { count, error: reviewError } = await admin
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .eq("gig_id", gigId)
        .eq("reviewer_id", notif.user_id);
      if (reviewError) return json(500, { error: reviewError.message });
      if ((count ?? 0) > 0) return json(200, { skipped: "already_reviewed" });
    }
  }

  const { data: prefs, error: prefError } = await admin
    .from("users")
    .select("email_alerts_enabled")
    .eq("id", notif.user_id)
    .maybeSingle();
  if (prefError) return json(500, { error: prefError.message });
  if (!prefs?.email_alerts_enabled) return json(200, { skipped: "opt_out" });

  const { data: userData, error: userError } = await admin.auth.admin.getUserById(
    notif.user_id,
  );
  const to = userData?.user?.email?.trim();
  if (userError || !to) return json(200, { skipped: "no_email" });

  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) return json(500, { error: "RESEND_API_KEY is not set" });

  const copy = mailCopy(notif);
  const subject = copy.subject;
  const html = buildHtml(notif);
  const text = [copy.headline, copy.body, ctaFor(notif).url].filter(Boolean).join("\n\n");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": notif.id,
    },
    body: JSON.stringify({
      from: FROM,
      to: [to],
      subject,
      html,
      text,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("resend_failed", res.status, detail);
    return json(502, { error: "Email provider rejected the send" });
  }

  return json(200, { sent: true, id: notif.id });
});
