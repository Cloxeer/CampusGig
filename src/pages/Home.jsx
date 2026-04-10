import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Award } from "lucide-react";
import { getMyProfile, getOpenGigs, getAvatarUrl, normalizeGig, requestGig } from "../lib/profile";
import { getLevel, useTimer } from "../utils/helpers";
import { useModalParam } from "../hooks/useModalParam";
import Logo, { LogoMark } from "../components/Logo";
import GigCard from "../components/GigCard";
import GigDetailModal from "../components/modals/GigDetailModal";
import RepDetailModal from "../components/modals/RepDetailModal";

const TABS = ["Recent", "Food", "Errands", "Notes", "All"];

function HomeSkeleton() {
  return (
    <div className="page fadein">
      <div className="topbar">
        <div className="tlogo">
          <div className="skel" style={{ width: 26, height: 26, borderRadius: 6 }} />
          <div className="skel" style={{ width: 90, height: 16 }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div className="skel" style={{ width: 34, height: 34, borderRadius: "var(--r)" }} />
          <div className="skel skel-circle" style={{ width: 30, height: 30 }} />
        </div>
      </div>
      <div className="scroll" style={{ paddingBottom: 80 }}>
        <div style={{ margin: "14px 16px 0" }}>
          <div className="rep-card" style={{ padding: 16 }}>
            <div className="skel-rep" style={{ width: 140, height: 10, marginBottom: 10 }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
              <div className="skel-rep" style={{ width: 70, height: 28 }} />
              <div className="skel-rep" style={{ width: 60, height: 22, borderRadius: 5 }} />
            </div>
            <div className="skel-rep" style={{ width: "100%", height: 2, marginBottom: 8 }} />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              {[40, 50, 46, 44].map((w, i) => (
                <div key={i} className="skel-rep" style={{ width: w, height: 9 }} />
              ))}
            </div>
          </div>
        </div>
        <div style={{ padding: "14px 16px 0", display: "flex", gap: 8 }}>
          {TABS.map((t) => (
            <div key={t} className="skel" style={{ width: 52, height: 28, borderRadius: 6 }} />
          ))}
        </div>
        <div style={{ padding: "18px 16px 0", display: "flex", flexDirection: "column", gap: 7 }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skel" style={{ width: "100%", height: 88, borderRadius: "var(--rlg)" }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home({ currentUserId }) {
  const navigate = useNavigate();
  const [repOpen, openRep, closeRep] = useModalParam("rep");
  const [gigParam, openGig, closeGig] = useModalParam("gig");

  const [tab, setTab] = useState("Recent");
  const [requested, setRequested] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [gigs, setGigs] = useState([]);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const tick = useTimer();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setRequested(false);
  }, [gigParam]);

  useEffect(() => {
    function onVisible() {
      if (document.visibilityState !== "visible") return;
      getOpenGigs().then(({ gigs: raw }) => {
        setGigs((raw || []).map(normalizeGig));
      });
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  useEffect(() => {
    if (!loading && gigParam && !gigs.some((g) => g.id === gigParam)) {
      closeGig();
    }
  }, [loading, gigParam, gigs, closeGig]);

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

  const activeGigs = gigs.filter((g) => {
    if (!g.deadline) return true;
    return g.deadline > Date.now();
  });

  const filteredGigs = activeGigs.filter((g) => {
    if (tab === "Recent" || tab === "All") return true;
    if (tab === "Food") return g.cat === "Food";
    if (tab === "Errands") return g.cat === "Errand";
    if (tab === "Notes") return g.cat === "Notes";
    return true;
  });

  const selectedGig = gigParam && !loading
    ? gigs.find((g) => g.id === gigParam) || null
    : null;

  if (loading) return <HomeSkeleton />;

  return (
    <div className="page fadein">
      <div className="topbar">
        <div className="tlogo">
          <LogoMark />
          <Logo />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button className="btn bg-btn bico" onClick={() => navigate("/explore")}>
            <Search size={15} />
          </button>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              onClick={() => navigate("/profile")}
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
              onClick={() => navigate("/profile")}
            >
              {initials}
              <div className="av-dot" />
            </div>
          )}
        </div>
      </div>

      <div className="scroll" style={{ paddingBottom: 80 }}>
        <div style={{ margin: "14px 16px 0" }}>
          <div className="rep-card" style={{ cursor: "pointer" }} onClick={() => openRep()}>
            <div className="rc-ey">Rep Score · tap for details</div>
            <div className="rc-row">
              <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                <span className="rc-score">{repScore}</span>
                <span className="rc-pts">pts</span>
              </div>
              <div className="rc-badge" style={{ background: lvl.bg, color: lvl.color, borderColor: lvl.border }}>
                <Award size={10} /> {lvl.label}
              </div>
            </div>
            <div className="rc-track">
              <div className="rc-fill" style={{ width: `${lvl.pct}%`, background: lvl.color }} />
            </div>
            <div className="rc-labels">
              {["New", "Reliable", "Trusted", "Legend"].map((l) => (
                <span key={l} className="rc-lbl" style={lvl.label === l ? { color: lvl.color, fontWeight: 600 } : undefined}>
                  {l}
                </span>
              ))}
            </div>
            <div className="rc-footer">
              {lvl.next ? (
                <>
                  +{lvl.toNext} pts to <span style={{ color: lvl.nextColor }}>{lvl.next}</span> · +9 marking done · +10 as taker · +1 per post
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
                onClick={() => openGig(g.id)}
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
          currentUserId={currentUserId}
          onRequest={async () => {
            const result = await requestGig(selectedGig.id);
            if (!result.error) {
              setRequested(true);
              const { gigs: raw } = await getOpenGigs();
              setGigs((raw || []).map(normalizeGig));
              return { error: null };
            }
            return result;
          }}
          onClose={closeGig}
          onViewProfile={(userId) => navigate(`/users/${userId}`)}
          onGigDeleted={async () => {
            const { gigs: raw } = await getOpenGigs();
            setGigs((raw || []).map(normalizeGig));
          }}
        />
      )}

      {repOpen && <RepDetailModal onClose={closeRep} />}
    </div>
  );
}
