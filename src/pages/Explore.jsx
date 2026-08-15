import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, X } from "lucide-react";
import { useOpenGigsQuery } from "../hooks/useOpenGigsQuery";
import { useLegacyGigRedirect } from "../hooks/useLegacyGigRedirect";
import { useTimer } from "../utils/helpers";
import TopBar from "../components/TopBar";
import GigCard from "../components/GigCard";

export default function Explore({ currentUserId }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQ, setSearchQ] = useState("");
  const tick = useTimer();

  const { gigs: allGigs, isPending: gigsPending } = useOpenGigsQuery();

  useLegacyGigRedirect("/explore");

  const searchResults = allGigs.filter((g) =>
    searchQ.trim() === ""
      ? false
      : g.title.toLowerCase().includes(searchQ.toLowerCase()) ||
        g.cat.toLowerCase().includes(searchQ.toLowerCase()) ||
        g.loc.toLowerCase().includes(searchQ.toLowerCase()) ||
        g.poster.toLowerCase().includes(searchQ.toLowerCase())
  );

  return (
    <div className="page fadein">
      <TopBar title="Search" onBack={() => navigate("/", { replace: true })} />

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

      <div className="scroll scroll--nav-pad scroll--fine-scrollbar">
        {gigsPending ? (
          <div className="gig-grid" style={{ padding: "16px 16px 0" }}>
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
            <div className="gig-grid" style={{ padding: "0 16px" }}>
              {searchResults.map((g) => (
                <GigCard
                  key={g.id}
                  gig={g}
                  tick={tick}
                  onClick={() =>
                    navigate(`/gig/${g.id}`, {
                      state: { returnTo: `${location.pathname}${location.search}` },
                    })
                  }
                />
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
