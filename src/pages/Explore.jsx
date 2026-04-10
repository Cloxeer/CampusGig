import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { getOpenGigs, normalizeGig, requestGig } from "../lib/profile";
import { useTimer } from "../utils/helpers";
import { useModalParam } from "../hooks/useModalParam";
import TopBar from "../components/TopBar";
import GigCard from "../components/GigCard";
import GigDetailModal from "../components/modals/GigDetailModal";

export default function Explore({ currentUserId }) {
  const navigate = useNavigate();
  const [gigParam, openGig, closeGig] = useModalParam("gig");

  const [searchQ, setSearchQ] = useState("");
  const [allGigs, setAllGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requested, setRequested] = useState(false);
  const tick = useTimer();

  useEffect(() => {
    loadGigs();
  }, []);

  useEffect(() => {
    setRequested(false);
  }, [gigParam]);

  useEffect(() => {
    function onVisible() {
      if (document.visibilityState !== "visible") return;
      getOpenGigs().then(({ gigs: raw }) => {
        setAllGigs((raw || []).map(normalizeGig));
      });
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  useEffect(() => {
    if (!loading && gigParam && !allGigs.some((g) => g.id === gigParam)) {
      closeGig();
    }
  }, [loading, gigParam, allGigs, closeGig]);

  async function loadGigs() {
    setLoading(true);
    const { gigs } = await getOpenGigs();
    setAllGigs((gigs || []).map(normalizeGig));
    setLoading(false);
  }

  const searchResults = allGigs.filter((g) =>
    searchQ.trim() === ""
      ? false
      : g.title.toLowerCase().includes(searchQ.toLowerCase()) ||
        g.cat.toLowerCase().includes(searchQ.toLowerCase()) ||
        g.loc.toLowerCase().includes(searchQ.toLowerCase()) ||
        g.poster.toLowerCase().includes(searchQ.toLowerCase())
  );

  const selectedGig = gigParam && !loading
    ? allGigs.find((g) => g.id === gigParam) || null
    : null;

  return (
    <div className="page fadein">
      <TopBar title="Search" />

      <div style={{ padding: "12px 16px 0" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "var(--bg3)",
            border: "1px solid var(--bd)",
            borderRadius: "var(--r)",
            padding: "0 12px",
            height: 42,
          }}
        >
          <Search size={15} color="var(--fg3)" />
          <input
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              fontFamily: "var(--font)",
              fontSize: 14,
              color: "var(--fg)",
            }}
            placeholder="Search gigs, categories, locations…"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            autoFocus
          />
          {searchQ && (
            <button
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg3)", display: "flex" }}
              onClick={() => setSearchQ("")}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="scroll" style={{ paddingBottom: 80 }}>
        {loading ? (
          <div style={{ padding: "16px 16px 0", display: "flex", flexDirection: "column", gap: 7 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="skel" style={{ width: "100%", height: 88, borderRadius: "var(--rlg)" }} />
            ))}
          </div>
        ) : searchQ.trim() === "" ? (
          <div style={{ padding: "48px 16px", textAlign: "center" }}>
            <Search size={28} color="var(--fg4)" style={{ marginBottom: 10 }} />
            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--fg3)", marginBottom: 4 }}>Search for anything</div>
            <div style={{ fontSize: 12, color: "var(--fg4)" }}>Food runs, errands, notes, deliveries…</div>
          </div>
        ) : searchResults.length === 0 ? (
          <div style={{ padding: "48px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--fg3)", marginBottom: 4 }}>
              No results for "{searchQ}"
            </div>
            <div style={{ fontSize: 12, color: "var(--fg4)" }}>Try a different search term</div>
          </div>
        ) : (
          <div style={{ paddingTop: 10 }}>
            <div style={{ padding: "0 16px 8px", fontSize: 12, color: "var(--fg3)", fontFamily: "var(--mono)" }}>
              {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
            </div>
            <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 7 }}>
              {searchResults.map((g) => (
                <GigCard
                  key={g.id}
                  gig={g}
                  tick={tick}
                  onClick={() => openGig(g.id)}
                />
              ))}
            </div>
          </div>
        )}
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
              setAllGigs((raw || []).map(normalizeGig));
              return { error: null };
            }
            return result;
          }}
          onClose={closeGig}
          onViewProfile={(userId) => navigate(`/users/${userId}`)}
          onGigDeleted={async () => {
            const { gigs: raw } = await getOpenGigs();
            setAllGigs((raw || []).map(normalizeGig));
          }}
        />
      )}
    </div>
  );
}
