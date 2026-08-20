import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MapPin, Globe, Lock, Award, Clock, Package, Bike, MessageCircle, GraduationCap, Sparkles, Loader } from "lucide-react";
import { postNewGig, getGigForPosterEdit, updateMyGig } from "../lib/profile";
import { REMOTE_LOCATION } from "../lib/gigs";
import { CATEGORIES, FALLBACK_CATEGORY } from "../data/categories";
import { queryClient, queryKeys } from "../lib/queryClient";
import { readDraft, writeDraft, clearDraft } from "../utils/postGigDraft";
import TopBar from "../components/TopBar";

const ICON_MAP = {
  Bike: <Bike size={15} />,
  Package: <Package size={15} />,
  GraduationCap: <GraduationCap size={15} />,
  Sparkles: <Sparkles size={15} />,
  MessageCircle: <MessageCircle size={15} />,
};

const TIME_OPTIONS = [
  { label: "No limit", minutes: 0 },
  { label: "30 min", minutes: 30 },
  { label: "1 hour", minutes: 60 },
  { label: "2 hours", minutes: 120 },
  { label: "4 hours", minutes: 240 },
  { label: "8 hours", minutes: 480 },
  { label: "24 hours", minutes: 1440 },
];

function timeLimitIndexFromExpires(createdAt, expiresAt) {
  if (!expiresAt || !createdAt) return 0;
  const mins = Math.round((new Date(expiresAt).getTime() - new Date(createdAt).getTime()) / 60000);
  const i = TIME_OPTIONS.findIndex((o) => o.minutes === mins);
  return i >= 0 ? i : 0;
}

export default function PostGig() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const [cat, setCat] = useState(FALLBACK_CATEGORY);
  const [gigTitle, setGigTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("0");
  const [location, setLocation] = useState("");
  const [remote, setRemote] = useState(false);
  const [timeLimitIdx, setTimeLimitIdx] = useState(0);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState(null);
  const [loadingEdit, setLoadingEdit] = useState(!!editId);
  const [descFocused, setDescFocused] = useState(false);
  const [draftHydrated, setDraftHydrated] = useState(!!editId);
  const descRef = useRef(null);

  const COLLAPSED_DESC_PX = 80;

  useLayoutEffect(() => {
    if (editId) {
      setDraftHydrated(true);
      return;
    }
    const d = readDraft();
    if (d) {
      setCat(d.cat);
      setGigTitle(d.gigTitle);
      setDescription(d.description);
      setPrice(d.price);
      setLocation(d.location);
      setTimeLimitIdx(d.timeLimitIdx);
      setRemote(d.remote);
    }
    setDraftHydrated(true);
  }, [editId]);

  useEffect(() => {
    if (editId || !draftHydrated) return;
    writeDraft({ cat, gigTitle, description, price, location, timeLimitIdx, remote });
  }, [editId, draftHydrated, cat, gigTitle, description, price, location, timeLimitIdx, remote]);

  const syncDescriptionHeight = useCallback(() => {
    const el = descRef.current;
    if (!el) return;
    const apply = () => {
      if (!descFocused) {
        el.style.height = `${COLLAPSED_DESC_PX}px`;
        el.style.overflowY = "auto";
        return;
      }
      el.style.overflowY = "hidden";
      el.style.height = "auto";
      const next = Math.max(COLLAPSED_DESC_PX, el.scrollHeight);
      el.style.height = `${next}px`;
    };
    if (descFocused) {
      requestAnimationFrame(() => {
        requestAnimationFrame(apply);
      });
    } else {
      apply();
    }
  }, [descFocused]);

  useEffect(() => {
    syncDescriptionHeight();
  }, [description, descFocused, syncDescriptionHeight, loadingEdit]);

  useEffect(() => {
    if (!editId) {
      setLoadingEdit(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingEdit(true);
      setError(null);
      const { gig, error: loadErr } = await getGigForPosterEdit(editId);
      if (cancelled) return;
      if (loadErr || !gig) {
        setError(loadErr?.message || "Couldn't load this gig to edit.");
        setLoadingEdit(false);
        return;
      }
      const isRemote = gig.location === REMOTE_LOCATION;
      setCat(gig.category?.label || FALLBACK_CATEGORY);
      setGigTitle(gig.title || "");
      setDescription(gig.description || "");
      setPrice(String(gig.price ?? 0));
      setRemote(isRemote);
      setLocation(isRemote ? "" : gig.location || "");
      setTimeLimitIdx(timeLimitIndexFromExpires(gig.created_at, gig.expires_at));
      setLoadingEdit(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [editId]);

  async function handlePost() {
    if (!gigTitle.trim()) {
      setError("Please add a title.");
      return;
    }

    if (!remote && !location.trim()) {
      setError("Add a gig location, or switch to Remote.");
      return;
    }

    setPosting(true);
    setError(null);

    /* Remote gigs store the sentinel so remote/in-person survives a reload and
       shows correctly on every card; in-person stores the typed spot. */
    const locationToSave = remote ? REMOTE_LOCATION : location.trim();

    const selectedTime = TIME_OPTIONS[timeLimitIdx];
    let estimatedTime = null;
    if (selectedTime.minutes > 0) {
      estimatedTime = new Date(Date.now() + selectedTime.minutes * 60 * 1000).toISOString();
    }

    if (editId) {
      const { error: upErr } = await updateMyGig(editId, {
        title: gigTitle.trim(),
        description: String(description).trim() === "" ? null : description,
        categoryLabel: cat,
        price: parseFloat(price) || 0,
        location: locationToSave,
        estimatedTime,
      });
      if (upErr) {
        setError(upErr.message || "Failed to save changes.");
        setPosting(false);
        return;
      }
    } else {
      const { error: postError } = await postNewGig({
        title: gigTitle.trim(),
        description: String(description).trim() === "" ? null : description,
        categoryLabel: cat,
        price: parseFloat(price) || 0,
        location: locationToSave,
        estimatedTime,
      });

      if (postError) {
        setError(postError.message || "Failed to post gig.");
        setPosting(false);
        return;
      }
      clearDraft();
    }

    queryClient.invalidateQueries({ queryKey: queryKeys.openGigs });
    navigate("/", { replace: true });
  }

  return (
    <div className="page fadein">
      <TopBar
        title={editId ? "Edit gig" : "Post a gig"}
        right={
          editId ? (
            <button
              type="button"
              className="btn bp bsm"
              onClick={handlePost}
              disabled={posting || loadingEdit}
              style={{ opacity: posting || loadingEdit ? 0.7 : 1 }}
            >
              {loadingEdit ? (
                <>
                  <Loader size={14} className="spin" />
                  Loading…
                </>
              ) : posting ? (
                <>
                  <Loader size={14} className="spin" />
                  Saving…
                </>
              ) : (
                "Save"
              )}
            </button>
          ) : undefined
        }
      />

      <div className="scroll scroll--post-pad scroll--fine-scrollbar" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {editId && (
          <div
            style={{
              fontSize: 12,
              color: "var(--fg3)",
              lineHeight: 1.45,
              padding: "10px 12px",
              background: "var(--bg2)",
              border: "1px solid var(--bd)",
              borderRadius: "var(--r)",
            }}
          >
            You can <strong>edit</strong> or <strong>delete</strong> your gig until someone accepts it. After that, contact
            is managed through Alerts.
          </div>
        )}
        <div className="field">
          <label className="lbl">Category</label>
          <div className="cat-grid">
            {CATEGORIES.map((c) => (
              <div key={c.label} className={`cat ${cat === c.label ? "on" : ""}`} onClick={() => setCat(c.label)}>
                <div className="cico">{ICON_MAP[c.icon]}</div>
                <span className="clbl">{c.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="lbl">Title</label>
          <input
            className="inp"
            placeholder="e.g. Pick up food from Corbett"
            value={gigTitle}
            onChange={(e) => setGigTitle(e.target.value)}
          />
        </div>

        <div className="field">
          <label className="lbl">Task description</label>
          <textarea
            ref={descRef}
            className="ta"
            placeholder="Describe exactly what you need. Be specific — better descriptions get done faster."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onFocus={() => setDescFocused(true)}
            onBlur={() => setDescFocused(false)}
            rows={1}
            style={{
              minHeight: COLLAPSED_DESC_PX,
              overflowY: descFocused ? "hidden" : "auto",
            }}
          />
        </div>

        <div className="field">
          <label className="lbl">
            Offer <span style={{ color: "var(--fg4)", fontSize: 11, fontWeight: 400 }}>— $0 is fine</span>
          </label>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              border: "1px solid var(--bd)",
              borderRadius: "var(--r)",
              background: "var(--bg)",
              overflow: "hidden",
              transition: "border-color .12s",
            }}
          >
            <div
              style={{
                height: 40,
                padding: "0 12px",
                display: "flex",
                alignItems: "center",
                background: "var(--bg3)",
                borderRight: "1px solid var(--bd)",
                fontFamily: "var(--mono)",
                fontWeight: 600,
                fontSize: 15,
              }}
            >
              $
            </div>
            <input
              style={{
                flex: 1,
                height: 40,
                border: "none",
                outline: "none",
                padding: "0 12px",
                fontFamily: "var(--mono)",
                fontSize: 22,
                fontWeight: 700,
                color: "var(--fg)",
                letterSpacing: "-.04em",
                background: "transparent",
              }}
              type="number"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label className="lbl">
            <Clock size={12} style={{ display: "inline", verticalAlign: "-1px", marginRight: 4 }} />
            Time limit <span style={{ color: "var(--fg4)", fontSize: 11, fontWeight: 400 }}>— optional</span>
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {TIME_OPTIONS.map((opt, i) => (
              <button
                key={opt.label}
                type="button"
                className={`badge ${timeLimitIdx === i ? "" : "bn"}`}
                style={
                  timeLimitIdx === i
                    ? { background: "var(--ink)", color: "var(--ink-fg)", border: "1px solid var(--ink)", cursor: "pointer", padding: "5px 10px" }
                    : { cursor: "pointer", padding: "5px 10px" }
                }
                onClick={() => setTimeLimitIdx(i)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {TIME_OPTIONS[timeLimitIdx].minutes > 0 && (
            <span className="hint">
              Gig will be removed from the feed after {TIME_OPTIONS[timeLimitIdx].label}.
            </span>
          )}
        </div>

        <div className="field">
          <label className="lbl">Where</label>
          <div className="seg" role="tablist" aria-label="Gig location type">
            <button
              type="button"
              role="tab"
              aria-selected={!remote}
              className={`seg-btn ${!remote ? "on" : ""}`}
              onClick={() => setRemote(false)}
            >
              <MapPin size={13} /> In person
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={remote}
              className={`seg-btn ${remote ? "on" : ""}`}
              onClick={() => setRemote(true)}
            >
              <Globe size={13} /> Remote
            </button>
          </div>
          {remote ? (
            <span className="hint" style={{ display: "block", marginTop: 8 }}>
              Done from anywhere — no meetup spot needed.
            </span>
          ) : (
            <div className="ig" style={{ marginTop: 8 }}>
              <div className="iad">
                <MapPin size={13} />
              </div>
              <input
                className="ii"
                placeholder="e.g. Science Hall Room 118A"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="callout">
          <div className="ci">
            <Lock size={13} />
          </div>
          <span className="ct">
            <strong>Payment info is private.</strong> Your Venmo/Cash App from your profile is only shared once both parties accept the gig.
          </span>
        </div>

        <div className="callout" style={{ background: "var(--green-bg)", borderColor: "var(--green-bd)" }}>
          <div className="ci" style={{ color: "var(--green-d)" }}>
            <Award size={13} />
          </div>
          <span className="ct" style={{ color: "var(--green-text)" }}>
            <strong>+1 Rep</strong> for posting. When you mark the gig done, you earn <strong>+9</strong> and your taker <strong>+10</strong>. Each review adds <strong>+1 Rep per star</strong> (1–5) to the person being reviewed.
          </span>
        </div>

        {error && (
          <div style={{ fontSize: 12, color: "var(--err)", fontFamily: "var(--mono)", textAlign: "center" }}>
            {error}
          </div>
        )}

        <button
          className="btn bp bfull blg"
          onClick={handlePost}
          disabled={posting || loadingEdit}
          style={{ opacity: posting || loadingEdit ? 0.7 : 1 }}
        >
          {loadingEdit ? (
            <>
              <Loader size={16} className="spin" />
              Loading…
            </>
          ) : posting ? (
            <>
              <Loader size={16} className="spin" />
              {editId ? "Saving…" : "Posting…"}
            </>
          ) : editId ? (
            "Save changes"
          ) : (
            "Post gig"
          )}
        </button>
      </div>
    </div>
  );
}
