import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getOpenGigs, normalizeGig, requestGig, getGigById } from "../lib/profile";
import { queryClient, queryKeys, GIG_DETAIL_STALE_MS } from "../lib/queryClient";
import { useTimer } from "../utils/helpers";
import { useModalParam } from "../hooks/useModalParam";
import TopBar from "../components/TopBar";
import GigCard from "../components/GigCard";
import GigDetailModal from "../components/modals/GigDetailModal";

export default function Explore({ currentUserId }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [gigParam, openGig, closeGig] = useModalParam("gig");

  const [searchQ, setSearchQ] = useState("");
  const [requested, setRequested] = useState(false);
  const tick = useTimer();

  const { data: gigsData, isPending: gigsPending } = useQuery({
    queryKey: queryKeys.openGigs,
    queryFn: getOpenGigs,
    staleTime: 30_000,
    refetchOnWindowFocus: "always",
  });

  const allGigs = useMemo(() => (gigsData?.gigs || []).map(normalizeGig), [gigsData]);

  useEffect(() => {
    setRequested(false);
  }, [gigParam]);

  const listGig = useMemo(() => {
    if (!gigParam) return undefined;
    if (gigsPending) return undefined;
    return allGigs.find((g) => g.id === gigParam) ?? null;
  }, [gigParam, gigsPending, allGigs]);

  const { data: modalGig, isPending: gigModalPending } = useQuery({
    queryKey: queryKeys.gigById(gigParam),
    queryFn: async () => {
      const { gig } = await getGigById(gigParam);
      return gig ?? null;
    },
    enabled: Boolean(gigParam),
    staleTime: GIG_DETAIL_STALE_MS,
    placeholderData: listGig != null ? listGig : undefined,
  });

  useEffect(() => {
    if (!gigParam) return;
    if (gigsPending) return;
    if (listGig !== null) return;
    if (!gigModalPending && modalGig === null) closeGig();
  }, [gigParam, gigsPending, listGig, gigModalPending, modalGig, closeGig]);

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
                  onClick={() => openGig(g.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {gigParam && (modalGig != null || gigModalPending) && (
        <GigDetailModal
          gig={modalGig}
          loading={gigModalPending && modalGig == null}
          tick={tick}
          requested={requested}
          currentUserId={currentUserId}
          onRequest={async () => {
            const result = await requestGig(gigParam);
            if (!result.error) {
              setRequested(true);
              queryClient.invalidateQueries({ queryKey: queryKeys.openGigs });
              queryClient.invalidateQueries({ queryKey: queryKeys.gigById(gigParam) });
              return { error: null };
            }
            return result;
          }}
          onClose={closeGig}
          onViewProfile={(userId) =>
            navigate(`/profile/${userId}`, {
              state: {
                returnTo: `${location.pathname}?gig=${encodeURIComponent(gigParam)}`,
              },
            })
          }
          onGigDeleted={() => {
            queryClient.invalidateQueries({ queryKey: queryKeys.openGigs });
            queryClient.invalidateQueries({ queryKey: queryKeys.gigById(gigParam) });
          }}
        />
      )}
    </div>
  );
}
