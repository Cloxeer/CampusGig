import { useState, useEffect } from "react";
import { Search, Award, Loader } from "lucide-react";
import { getMyProfile, getOpenGigs, getAvatarUrl, normalizeGig } from "../lib/profile";
import { getLevel, useTimer } from "../utils/helpers";
import Logo, { LogoMark } from "../components/Logo";
import GigCard from "../components/GigCard";
import GigDetailModal from "../components/modals/GigDetailModal";

const TABS = ["Recent", "Food", "Errands", "Notes", "All"];

export default function Home({ setScreen }) {
  const [tab, setTab] = useState("Recent");
  const [selectedGig, setSelectedGig] = useState(null);
  const [requested, setRequested] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [gigs, setGigs] = useState([]);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const tick = useTimer();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [profileRes, gigsRes] = await Promise.all([
      getMyProfile(),
      getOpenGigs(),
    ]);

    if (profileRes.profile) {
      setProfile(profileRes.profile);
      if (profileRes.profile.avatar_url) {
        setAvatarUrl(getAvatarUrl(profileRes.profile.avatar_url));
      }
    }

    setGigs((gigsRes.gigs || []).map(normalizeGig));
    setLoading(false);
  }

  const repScore = profile?.rep_score || 0;
  const lvl = getLevel(repScore);
  const initials = `${profile?.first_name?.charAt(0) || ""}${profile?.last_name?.charAt(0) || ""}`.toUpperCase();

  const filteredGigs = gigs.filter((g) => {
    if (tab === "Recent" || tab === "All") return true;
    if (tab === "Food") return g.cat === "Food";
    if (tab === "Errands") return g.cat === "Errand";
    if (tab === "Notes") return g.cat === "Notes";
    return true;
  });

  if (loading) {
    return (
      <div className="page fadein" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <Loader size={20} className="spin" color="var(--fg3)" />
      </div>
    );
  }

  return (
    <div className="page fadein">
      <div className="topbar">
        <div className="tlogo">
          <LogoMark />
          <Logo />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button className="btn bg-btn bico" onClick={() => setScreen("explore")}>
            <Search size={15} />
          </button>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              onClick={() => setScreen("profile")}
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                objectFit: "cover",
                cursor: "pointer",
                border: "1px solid var(--bd)",
              }}
            />
          ) : (
            <div
              className="av"
              style={{ background: profile?.avatar_color || "#6366f1" }}
              onClick={() => setScreen("profile")}
            >
              {initials}
              <div className="av-dot" />
            </div>
          )}
        </div>
      </div>

      <div className="scroll" style={{ paddingBottom: 80 }}>
        <div style={{ margin: "14px 16px 0" }}>
          <div className="rep-card" style={{ cursor: "pointer" }} onClick={() => setScreen("repDetail")}>
            <div className="rc-ey">Rep Score · tap for details</div>
            <div className="rc-row">
              <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                <span className="rc-score">{repScore}</span>
                <span className="rc-pts">pts</span>
              </div>
              <div className="rc-badge">
                <Award size={10} /> {lvl.label}
              </div>
            </div>
            <div className="rc-track">
              <div className="rc-fill" style={{ width: `${lvl.pct}%` }} />
            </div>
            <div className="rc-labels">
              {["New", "Reliable", "Trusted", "Legend"].map((l) => (
                <span key={l} className={`rc-lbl ${lvl.label === l ? "cur" : ""}`}>
                  {l}
                </span>
              ))}
            </div>
            <div className="rc-footer">
              {lvl.next ? (
                <>
                  +{lvl.toNext} pts to <span className="accent">{lvl.next}</span> · +10 per gig completed · +1 per gig posted
                </>
              ) : (
                "Max level reached"
              )}
            </div>
          </div>
        </div>

        <div style={{ padding: "0 16px" }}>
          <div className="tabs" style={{ margin: "14px -16px 0", padding: "0 16px" }}>
            {TABS.map((t) => (
              <button key={t} className={`tab ${tab === t ? "on" : ""}`} onClick={() => setTab(t)}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: "14px 16px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", letterSpacing: "-.01em" }}>
            {filteredGigs.length} open gig{filteredGigs.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 7 }}>
          {filteredGigs.length === 0 ? (
            <div style={{ padding: "32px 0", textAlign: "center", color: "var(--fg4)", fontSize: 13, fontFamily: "var(--mono)" }}>
              No gigs yet — be the first to post one!
            </div>
          ) : (
            filteredGigs.map((g) => (
              <GigCard
                key={g.id}
                gig={g}
                tick={tick}
                onClick={() => {
                  setSelectedGig(g);
                  setRequested(false);
                }}
              />
            ))
          )}
        </div>
        <div style={{ height: 16 }} />
      </div>

      {selectedGig && (
        <GigDetailModal
          gig={selectedGig}
          tick={tick}
          requested={requested}
          onRequest={() => setRequested(true)}
          onClose={() => setSelectedGig(null)}
        />
      )}
    </div>
  );
}
