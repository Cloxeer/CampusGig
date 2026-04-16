import TopBar from "../../components/TopBar";
import { groupNotifications } from "./notificationModel";
import { useAlertsQuery } from "./useAlertsQuery";
import { useAlertsMarkAllReadOnMount } from "./useAlertsMarkAllReadOnMount";
import { useAlertsActions } from "./useAlertsActions";
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

  const notifications = alertsData?.notifications || [];
  const gigStatusMap = alertsData?.gigStatusMap || {};
  const profileMap = alertsData?.profileMap || {};
  const hasUnread = notifications.some((n) => !n.read);
  const groups = groupNotifications(notifications);

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
        ) : groups.length === 0 ? (
          <AlertsEmptyState />
        ) : (
          groups.map((group) => {
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
          })
        )}
      </div>
    </div>
  );
}
