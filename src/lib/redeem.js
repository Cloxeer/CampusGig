/**
 * Code redemption — fundraiser / promo codes that grant a cosmetic.
 *
 * Ownership is ALWAYS server-authoritative: the `redeem_code` RPC validates the
 * code (active, not expired, uses remaining, not already redeemed by this user)
 * and grants the cosmetic into public.user_cosmetics inside a SECURITY DEFINER
 * body. The client never grants anything itself — on success we only optimistically
 * mirror the new item into the local cache and then re-hydrate from server truth.
 *
 * A code can grant either a FIXED cosmetic or a chest-style random ROLL; either
 * way the server decides and returns the resolved `cosmetic_id`.
 *
 * Return shape (never throws for expected outcomes):
 *   { status: "ok", cosmetic_id, dup?: boolean }   — granted (dup = already owned)
 *   { status: "invalid" }                           — no such code
 *   { status: "expired" }                           — past expires_at / inactive
 *   { status: "depleted" }                          — global max_redemptions hit
 *   { status: "already_redeemed" }                  — this user already used it
 *   { status: "error", message }                    — auth / unexpected
 */

import { supabase } from "./supabase";
import { collectCosmetic, hydrateInventory } from "./cosmeticsInventory";

/** Normalize the way the server does: trim + uppercase, collapse inner spaces. */
export function normalizeCode(raw) {
  return String(raw || "").trim().toUpperCase().replace(/\s+/g, "");
}

export async function redeemCode(rawCode) {
  const code = normalizeCode(rawCode);
  if (!code) return { status: "invalid" };

  const { data, error } = await supabase.rpc("redeem_code", { p_code: code });
  if (error) {
    return { status: "error", message: error.message || "Something went wrong." };
  }

  const res = data && typeof data === "object" ? data : { status: "error" };
  if (res.status === "ok" && res.cosmetic_id) {
    collectCosmetic(res.cosmetic_id); // instant local reflect…
    hydrateInventory();               // …then reconcile with server truth
  }
  return res;
}
