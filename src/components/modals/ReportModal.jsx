import { useState, useEffect } from "react";
import { X, Loader, Flag, CheckCircle, Bug, HelpCircle, ExternalLink, Send } from "lucide-react";
import { submitReport } from "../../lib/profile";
import { BUG_REPORT_PAGE_OPTIONS, bugReportPathFromLocation } from "../../utils/bugReportPages";
import { COMMUNITY_DISCORD_INVITE_URL, DISCORD_SUPPORT_USERNAME } from "../../utils/supportCommunity";

const REASONS_BASE = [
  { value: "harassment", label: "Harassment or bullying" },
  { value: "spam", label: "Spam or fake review" },
  { value: "false_info", label: "False information" },
  { value: "hate_speech", label: "Hate speech" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "other", label: "Other" },
];

function reasonsForType(subjectType) {
  if (subjectType === "gig") {
    return REASONS_BASE.map((r) =>
      r.value === "spam" ? { ...r, label: "Spam or misleading listing" } : r
    );
  }
  if (subjectType === "user") {
    return REASONS_BASE.map((r) =>
      r.value === "spam" ? { ...r, label: "Spam or fake account" } : r
    );
  }
  return REASONS_BASE;
}

const COPY = {
  review: {
    title: "Report review",
    subtitle: "Why are you reporting this review?",
  },
  gig: {
    title: "Report gig",
    subtitle: "Why are you reporting this gig listing?",
  },
  user: {
    title: "Report user",
    subtitle: "Why are you reporting this person?",
  },
  BugReport: {
    title: "Report a bug",
    subtitle: "Tell us which screen you were on and what went wrong — it helps everyone on campus.",
  },
  SupportReport: {
    title: "Help & support",
    subtitle: "",
  },
};

const BUG_DETAILS_PLACEHOLDER = `Please describe where and how the bug occurred.

For example:
- Which component or screen?
- What actions led to the issue?
- Any error messages or unusual behavior?`;

/**
 * Unified report flow: review | gig | user | BugReport | SupportReport.
 */
export default function ReportModal({ subjectType, reviewId, gigId, reportedUserId, onClose, onReported, initialPagePath }) {
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState("");
  const [pagePath, setPagePath] = useState("");
  const [supportTab, setSupportTab] = useState("info");
  const [supportContact, setSupportContact] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const isBug = subjectType === "BugReport";
  const isSupport = subjectType === "SupportReport";
  const meta = COPY[subjectType] || COPY.review;
  const reasonRows = reasonsForType(subjectType);

  useEffect(() => {
    if (!isBug) return;
    const mapped = bugReportPathFromLocation(initialPagePath);
    setPagePath(mapped || (BUG_REPORT_PAGE_OPTIONS[0] && BUG_REPORT_PAGE_OPTIONS[0].path) || "");
  }, [isBug, initialPagePath]);

  async function handleSubmit() {
    if (isSupport) {
      if (supportTab !== "form" || !supportContact.trim() || !supportMessage.trim()) return;
    } else if (isBug) {
      if (!pagePath || !details.trim()) return;
    } else if (!selected) {
      return;
    }
    setSubmitting(true);
    setError(null);

    let err;
    if (isSupport) {
      const r = await submitReport({
        subjectType: "SupportReport",
        reason: supportContact.trim(),
        details: supportMessage.trim(),
      });
      err = r.error;
    } else if (isBug) {
      const r = await submitReport({
        subjectType: "BugReport",
        reason: pagePath,
        details: details.trim(),
      });
      err = r.error;
    } else {
      const r = await submitReport({
        subjectType,
        reviewId: subjectType === "review" ? reviewId : undefined,
        gigId: subjectType === "gig" ? gigId : undefined,
        reportedUserId: subjectType === "user" ? reportedUserId : undefined,
        reason: selected,
        details: selected === "other" ? details.trim() || null : null,
      });
      err = r.error;
    }

    if (err) {
      const msg = err.message || "";
      if (/duplicate|unique|23505/i.test(msg)) {
        setDone(true);
      } else {
        setError(msg || "Something went wrong.");
      }
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setDone(true);
    onReported?.();
  }

  const supportFormValid = supportContact.trim().length > 0 && supportMessage.trim().length > 0;

  return (
    <div className="modal-center-root" onClick={onClose}>
      <div className="modal-center-backdrop" aria-hidden />
      <div className="modal-center-card" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div style={{ padding: "32px 24px", textAlign: "center" }}>
            <CheckCircle size={36} color="var(--green-d)" strokeWidth={1.5} style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-.02em", marginBottom: 6 }}>
              {isBug ? "Thanks — we got it" : isSupport ? "Message sent" : "Report submitted"}
            </div>
            <div style={{ fontSize: 13, color: "var(--fg3)", lineHeight: 1.5, marginBottom: 20 }}>
              {isBug
                ? "We read every bug report and use them to improve the app for you and your classmates."
                : isSupport
                  ? "We&apos;ll use what you shared to follow up when we can. For faster answers, say hi on Discord too."
                  : "Thanks for helping keep CampusGig safe. We&apos;ll review this shortly."}
            </div>
            <button type="button" className="btn bp bfull" style={{ borderRadius: 12, height: 44 }} onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="modal-center-hd">
              <div className="modal-center-hd-title">
                {isSupport ? (
                  <HelpCircle size={15} color="var(--fg3)" aria-hidden />
                ) : isBug ? (
                  <Bug size={15} color="var(--fg3)" aria-hidden />
                ) : (
                  <Flag size={15} color="var(--fg3)" aria-hidden />
                )}
                <span>{meta.title}</span>
              </div>
              <button type="button" className="modal-center-close" onClick={onClose} aria-label="Close">
                <X size={13} />
              </button>
            </div>

            {isSupport ? (
              <div
                role="tablist"
                aria-label="Help and support"
                style={{
                  display: "flex",
                  borderBottom: "1px solid var(--bd)",
                  padding: "0 8px",
                  flexShrink: 0,
                  marginTop: -4,
                }}
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={supportTab === "info"}
                  className={`ptab${supportTab === "info" ? " on" : ""}`}
                  onClick={() => setSupportTab("info")}
                >
                  How to get help
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={supportTab === "form"}
                  className={`ptab${supportTab === "form" ? " on" : ""}`}
                  onClick={() => setSupportTab("form")}
                >
                  Send a message
                </button>
              </div>
            ) : (
              <div style={{ padding: "0 20px 4px", fontSize: 13, color: "var(--fg3)", lineHeight: 1.5, flexShrink: 0 }}>
                {meta.subtitle}
              </div>
            )}

            <div
              className="modal-center-body"
              style={{ padding: isBug || isSupport ? "12px 20px 8px" : "8px 12px 4px" }}
            >
              {isSupport && supportTab === "info" ? (
                <div style={{ fontSize: 14, color: "var(--fg2)", lineHeight: 1.55 }}>
                  <p style={{ margin: "0 0 12px" }}>
                    The fastest way to get unstuck is our{" "}
                    <strong style={{ color: "var(--fg)" }}>GetCampusGig.com</strong> Discord — other students and the
                    team hang out there.
                  </p>
                  <p style={{ margin: "0 0 14px" }}>
                    Join the server, then ask for <strong style={{ fontFamily: "var(--mono)" }}>@{DISCORD_SUPPORT_USERNAME}</strong>{" "}
                    so the right person sees your question.
                  </p>
                  <a
                    href={COMMUNITY_DISCORD_INVITE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn bp bfull"
                    style={{
                      borderRadius: 12,
                      height: 44,
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      marginBottom: 12,
                    }}
                  >
                    <ExternalLink size={16} aria-hidden />
                    Open Discord invite
                  </a>
                  <p className="hint" style={{ margin: 0 }}>
                    Prefer not to use Discord? Use the <strong>Send a message</strong> tab — tell us how to reach you and
                    what you need.
                  </p>
                </div>
              ) : null}

              {isSupport && supportTab === "form" ? (
                <>
                  <div className="field" style={{ marginBottom: 14 }}>
                    <label className="lbl" htmlFor="support-contact">
                      How should we contact you?
                    </label>
                    <input
                      id="support-contact"
                      type="text"
                      className="inp"
                      autoComplete="email"
                      placeholder="Email, Discord @username, phone — whatever you prefer"
                      value={supportContact}
                      onChange={(e) => setSupportContact(e.target.value)}
                      maxLength={320}
                    />
                    <p className="hint" style={{ marginTop: 6 }}>
                      We only use this to reply about your request. Be sure it&apos;s something you check often.
                    </p>
                  </div>
                  <div className="field">
                    <label className="lbl" htmlFor="support-message">
                      What do you need help with?
                    </label>
                    <textarea
                      id="support-message"
                      className="ta"
                      style={{ minHeight: 120, fontSize: 14, borderRadius: 10, lineHeight: 1.45 }}
                      placeholder="Describe your question or situation. The more context (which screen, what you tried), the easier it is to help."
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                      maxLength={2000}
                      rows={6}
                    />
                  </div>
                </>
              ) : null}

              {isBug ? (
                <>
                  <div className="field" style={{ marginBottom: 14 }}>
                    <label className="lbl" htmlFor="bug-report-page">
                      Which page were you on?
                    </label>
                    <select
                      id="bug-report-page"
                      className="inp"
                      style={{ height: 44, cursor: "pointer", WebkitTapHighlightColor: "transparent" }}
                      value={pagePath}
                      onChange={(e) => setPagePath(e.target.value)}
                    >
                      {BUG_REPORT_PAGE_OPTIONS.map((o) => (
                        <option key={o.path} value={o.path}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <p className="hint" style={{ marginTop: 6 }}>
                      Pick the screen that best matches where the problem showed up.
                    </p>
                  </div>
                  <div className="field">
                    <label className="lbl" htmlFor="bug-report-details">
                      What did you notice?
                    </label>
                    <textarea
                      id="bug-report-details"
                      className="ta"
                      style={{ minHeight: 100, fontSize: 14, borderRadius: 10, lineHeight: 1.45 }}
                      placeholder={BUG_DETAILS_PLACEHOLDER}
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      maxLength={2000}
                      rows={5}
                    />
                    <p className="hint" style={{ marginTop: 6 }}>
                      You can mention buttons you tapped, what you expected, and what you saw instead — no need to be
                      technical.
                    </p>
                  </div>
                </>
              ) : null}

              {!isBug && !isSupport ? (
                <>
                  {reasonRows.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setSelected(r.value)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "11px 10px",
                        border: "none",
                        borderRadius: 10,
                        background: selected === r.value ? "var(--bg3)" : "transparent",
                        cursor: "pointer",
                        transition: "background .12s",
                        fontFamily: "var(--font)",
                        WebkitTapHighlightColor: "transparent",
                      }}
                    >
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          border: selected === r.value ? "6px solid var(--ink)" : "2px solid var(--bd2)",
                          flexShrink: 0,
                          transition: "border .12s",
                          boxSizing: "border-box",
                        }}
                      />
                      <span style={{ fontSize: 14, fontWeight: 450, color: "var(--fg)", letterSpacing: "-.01em" }}>
                        {r.label}
                      </span>
                    </button>
                  ))}

                  {selected === "other" && (
                    <div style={{ padding: "4px 8px 0" }}>
                      <textarea
                        className="ta"
                        style={{ minHeight: 56, fontSize: 13, borderRadius: 10 }}
                        placeholder="Please describe the issue…"
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                        maxLength={500}
                      />
                    </div>
                  )}
                </>
              ) : null}
            </div>

            {error && (
              <div style={{ padding: "0 20px 8px", fontSize: 12, color: "var(--err)", fontFamily: "var(--mono)" }}>
                {error}
              </div>
            )}

            {isSupport && supportTab === "info" ? null : (
              <div className="modal-center-ft" style={{ paddingTop: 8 }}>
                <button
                  type="button"
                  className="btn bp bfull"
                  style={{
                    borderRadius: 12,
                    height: 44,
                    opacity:
                      (isBug ? !pagePath || !details.trim() : isSupport ? !supportFormValid : !selected) || submitting
                        ? 0.5
                        : 1,
                    ...(isBug || isSupport ? {} : { background: "var(--err)" }),
                  }}
                  disabled={
                    (isBug ? !pagePath || !details.trim() : isSupport ? !supportFormValid : !selected) || submitting
                  }
                  onClick={handleSubmit}
                >
                  {submitting ? (
                    <Loader size={14} className="spin" />
                  ) : isBug ? (
                    <Bug size={14} />
                  ) : isSupport ? (
                    <Send size={14} />
                  ) : (
                    <Flag size={14} />
                  )}
                  {submitting ? "Submitting…" : isBug ? "Send report" : isSupport ? "Send message" : "Submit Report"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
