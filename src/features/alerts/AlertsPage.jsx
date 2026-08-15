import { useState } from "react";
import { ChevronDown } from "lucide-react";
import TopBar from "../../components/TopBar";
import { groupNotifications } from "./notificationModel";
import { groupByDateBucket } from "../../utils/dateBuckets";
import { useAlertsQuery } from "./hooks/useAlertsQuery";
import { useAlertsMarkAllReadOnMount } from "./hooks/useAlertsMarkAllReadOnMount";
import { useAlertsActions } from "./hooks/useAlertsActions";
import AlertSkeletonList from "./components/AlertSkeletonList";
import AlertsEmptyState from "./components/AlertsEmptyState";
import GigRequestGroupRow from "./components/GigRequestGroupRow";
import SingleAlertRow from "./components/SingleAlertRow";

export default function AlertsPage() {
  const { data: alertsData, isPending: alertsPending, isError, refetch } = useAlertsQuery();
  useAlertsMarkAllReadOnMount();
  const {
    acceptingId,
    handleMarkRead,
    handleDelete,
    handleDeleteGroup,
    handleNotifClick,
    handleGroupClick,
    handleInlineAccept,
  } = useAlertsActions();
  const [olderOpen, setOlderOpen] = useState(false);

  const notifications = alertsData?.notifications || [];
  const gigStatusMap = alertsData?.gigStatusMap || {};
  const profileMap = alertsData?.profileMap || {};
  const hasUnread = notifications.some((n) => !n.read);
  const groups = groupNotifications(notifications);
  /* Date buckets keep a long-lived inbox tidy: recent sections stay visible,
     everything older collapses behind a count. A group dates by its newest item. */
  const buckets = groupByDateBucket(groups, (g) => new Date(g.items[0].created_at).getTime());

  function renderGroup(group) {
    if (group.kind === "gig_requests") {
      const items = group.items;
      const latest = items[0];
      return (
        <GigRequestGroupRow
          key={`grp-${latest.metadata.gig_id}`}
          items={items}
          profileMap={profileMap}
          gigStatusMap={gigStatusMap}
          onRowClick={handleGroupClick}
          onDeleteGroup={handleDeleteGroup}
        />
      );
    }

    const n = group.items[0];
    return (
      <SingleAlertRow
        key={n.id}
        notification={n}
        profileMap={profileMap}
        gigStatusMap={gigStatusMap}
        acceptingId={acceptingId}
        onRowClick={handleNotifClick}
        onDelete={handleDelete}
        onInlineAccept={handleInlineAccept}
      />
    );
  }

  function handleClearOlder(e, olderGroups) {
    e.stopPropagation();
    const items = olderGroups.flatMap((g) => g.items);
    handleDeleteGroup(items);
  }

  return (
    <div className="page fadein">
      <TopBar
        title="Alerts"
        right={
          hasUnread ? (
            <button type="button" className="btn bg-btn bsm" onClick={handleMarkRead}>
              Mark read
            </button>
          ) : null
        }
      />

      <div className="scroll scroll--nav-pad scroll--fine-scrollbar">
        {alertsPending ? (
          <AlertSkeletonList />
        ) : isError ? (
          <div style={{ padding: "48px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--fg3)", marginBottom: 12 }}>
              Couldn&apos;t load alerts
            </div>
            <button type="button" className="btn bg-btn bsm" onClick={() => refetch()}>
              Try again
            </button>
          </div>
        ) : buckets.length === 0 ? (
          <AlertsEmptyState />
        ) : (
          buckets.map((bucket) => {
            if (bucket.key !== "older") {
              return (
                <div key={bucket.key}>
                  <div className="date-hd">{bucket.label}</div>
                  {bucket.items.map(renderGroup)}
                </div>
              );
            }

            const olderCount = bucket.items.reduce((sum, g) => sum + g.items.length, 0);
            return (
              <div key="older">
                <div
                  className="older-hd"
                  role="button"
                  tabIndex={0}
                  aria-expanded={olderOpen}
                  onClick={() => setOlderOpen((v) => !v)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setOlderOpen((v) => !v);
                    }
                  }}
                >
                  <span className="older-hd__label">Older · {olderCount}</span>
                  <ChevronDown size={12} className={`older-hd__chev${olderOpen ? " older-hd__chev--open" : ""}`} />
                  {olderOpen ? (
                    <button
                      type="button"
                      className="older-hd__clear"
                      onClick={(e) => handleClearOlder(e, bucket.items)}
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
                <div className={`older-body${olderOpen ? " older-body--open" : ""}`} aria-hidden={!olderOpen}>
                  <div>{bucket.items.map(renderGroup)}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
