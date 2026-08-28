import { CONTACT_MESSAGE_KEYS, CONTACT_PAY_KEYS } from "../utils/contactDisplay";

/** How long Mark as Done stays locked after the gig goes active. */
export const GIG_TASK_LOCK_MS = 5 * 60 * 1000;

export const SPOT_COACH_ADVANCE_MS = 5200;
export const SPOT_COACH_HOP_MS = 360;
export const SPOT_COACH_SIZE = 68;

/** How they actually reach each other (school email counts on campus). */
export const MESSAGE_CONTACT_KEYS = CONTACT_MESSAGE_KEYS;

export const PAY_CONTACT_KEYS = CONTACT_PAY_KEYS;

export function firstRowKey(rowKeys, preferred) {
  return preferred.find((key) => rowKeys.has(key)) || null;
}

export function scriptFromCoachSteps(steps) {
  if (!steps.length) return null;
  return {
    noOpener: true,
    intro: steps[0].line,
    hints: steps.slice(1).map((s) => s.line),
    closer: "You're set. Stay safe.",
  };
}

export const ALERT_GIG_ACCEPTED_CHAT = "alert-gig-accepted-active";
export const ALERT_GIG_ACCEPTED_SCRIPT = {
  noOpener: true,
  intro: "It's active. Tap it.",
};
export const ALERT_SPOT_SIZE = 56;

export function buildGigDetailCoachSteps({
  role,
  counterpartName,
  hasPerson,
  hasMessage,
  hasPay,
  hasMarkDone,
  hasTakerWait,
}) {
  const isTaker = role === "requester";
  const name = counterpartName || (isTaker ? "the poster" : "them");
  const steps = [];

  if (hasPerson) {
    steps.push({
      key: "person",
      mood: "excited",
      line: isTaker
        ? `That's ${name}. You reach out first — text or DM.`
        : `That's ${name}. They'll text or DM you first — you don't chase.`,
    });
  }

  if (hasMessage) {
    steps.push({
      key: "message",
      mood: "attentive",
      line: isTaker
        ? `Use this. Type: "Hey, I got your gig."`
        : `This is what they'll hit. Watch for "Hey, I got your gig."`,
    });
  }

  if (hasPay) {
    steps.push({
      key: "pay",
      mood: "attentive",
      line: isTaker
        ? "This is how you get paid. Not through us."
        : "When it's done, pay them here. Not through us.",
    });
  }

  if (hasMarkDone) {
    steps.push({
      key: "done",
      mood: "attentive",
      line: "Pay first. Then mark as done and leave a review.",
    });
  } else if (hasTakerWait) {
    steps.push({
      key: "done",
      mood: "attentive",
      line: "Do the task. They mark it done after they pay you. Then leave a review.",
    });
  }

  return steps;
}

export function deriveGigTaskLock(gig, now = Date.now()) {
  if (!gig || gig.status !== "active") {
    return { locked: false, remainingMs: 0, endsAt: null };
  }
  const start = new Date(gig.updated_at || gig.created_at).getTime();
  if (!Number.isFinite(start)) return { locked: false, remainingMs: 0, endsAt: null };
  const endsAt = start + GIG_TASK_LOCK_MS;
  const remainingMs = Math.max(0, endsAt - now);
  return { locked: remainingMs > 0, remainingMs, endsAt };
}
