import { Trophy } from "lucide-react";
import LevelBadge from "../../../components/LevelBadge";
import UserAvatar from "../../../components/UserAvatar";
import { getLevel } from "../../../utils/helpers";

export default function ProfileLeaderboardTab({
  leaderboard,
  totalUsers,
  rank,
  profile,
  avatarUrl,
  fullName,
  lvl,
  repScore,
  navigate,
}) {
  const userInBoard = leaderboard.some((p) => p.isYou);
  return (
    <div>
      <div style={{ padding: "10px 16px 6px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Trophy size={12} color="var(--fg3)" />
          <span style={{ fontSize: 12, color: "var(--fg3)", fontFamily: "var(--mono)" }}>Campus · top 100</span>
        </div>
        <span style={{ fontSize: 11, color: "var(--fg4)", fontFamily: "var(--mono)" }}>
          {totalUsers} student{totalUsers !== 1 ? "s" : ""}
        </span>
      </div>
      {leaderboard.length === 0 && (
        <div style={{ padding: "32px 0", textAlign: "center", color: "var(--fg4)", fontSize: 13, fontFamily: "var(--mono)" }}>
          No leaderboard data yet.
        </div>
      )}
      {leaderboard.map((p) => (
        <div
          key={p.rank}
          className={`lb-row ${p.isYou ? "lb-you" : ""}`}
          style={{ cursor: p.isYou ? "default" : "pointer" }}
          onClick={() => {
            if (!p.isYou && p.userId) navigate(`/profile/${p.userId}`);
          }}
        >
          <span className={`lb-rank ${p.rank <= 3 ? "top" : ""}`}>{p.rank}</span>
          <UserAvatar
            user={{ resolvedAvatarUrl: p.avatarUrl, avatar_color: p.color, first_name: p.initials?.[0], last_name: p.initials?.[1] }}
            size={32}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)" }}>
              {p.name}
              {p.isYou && (
                <span style={{ fontSize: 10, color: "var(--fg3)", fontFamily: "var(--mono)", marginLeft: 5 }}>you</span>
              )}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--fg3)",
                fontFamily: "var(--mono)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <LevelBadge label={getLevel(p.rep).label} small />
            </div>
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--fg2)", fontFamily: "var(--mono)", flexShrink: 0 }}>
            {p.rep}
          </span>
        </div>
      ))}

      {!userInBoard && rank && (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "6px 16px",
              gap: 6,
            }}
          >
            <span style={{ fontSize: 18, color: "var(--fg4)", letterSpacing: 2 }}>···</span>
          </div>
          <div
            className="lb-row lb-you"
            style={{
              position: "sticky",
              bottom: 0,
              borderTop: "2px solid var(--green-bd)",
              borderBottom: "none",
              background: "var(--green-bg)",
            }}
          >
            <span className="lb-rank">{rank}</span>
            <UserAvatar
              user={{ resolvedAvatarUrl: avatarUrl, avatar_color: profile.avatar_color, first_name: profile.first_name, last_name: profile.last_name }}
              size={32}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)" }}>
                {fullName}
                <span style={{ fontSize: 10, color: "var(--fg3)", fontFamily: "var(--mono)", marginLeft: 5 }}>you</span>
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--fg3)",
                  fontFamily: "var(--mono)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <LevelBadge label={lvl.label} small />
              </div>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--fg2)", fontFamily: "var(--mono)", flexShrink: 0 }}>
              {repScore}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
