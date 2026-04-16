export function isDeletable(n, gigStatusMap) {
  if (!n.metadata?.gig_id) return true;
  if (n.type === "gig_completed" || n.type === "gig_rejected") return true;
  const gs = gigStatusMap[n.metadata.gig_id];
  if (!gs) return true;
  if (gs.status === "completed" || gs.status === "cancelled") return true;
  if (gs.status === "open" && n.type !== "gig_request_sent") return true;
  return false;
}

export function groupNotifications(notifications) {
  const groups = [];
  const gigRequestBuckets = {};

  for (const n of notifications) {
    if (n.type === "gig_requested" && n.metadata?.gig_id) {
      const key = n.metadata.gig_id;
      if (!gigRequestBuckets[key]) {
        gigRequestBuckets[key] = [];
      }
      gigRequestBuckets[key].push(n);
    } else {
      groups.push({ kind: "single", items: [n] });
    }
  }

  for (const [, bucket] of Object.entries(gigRequestBuckets)) {
    if (bucket.length === 1) {
      groups.push({ kind: "single", items: bucket });
    } else {
      groups.push({ kind: "gig_requests", items: bucket });
    }
  }

  groups.sort((a, b) => {
    const aTime = new Date(a.items[0].created_at).getTime();
    const bTime = new Date(b.items[0].created_at).getTime();
    return bTime - aTime;
  });

  return groups;
}

export function getOtherUserId(meta) {
  if (meta.reviewer_id) return meta.reviewer_id;

  if (meta.role === "poster") return meta.requester_id;
  if (meta.role === "requester") return meta.poster_id;

  return meta.requester_id || meta.other_user_id || meta.poster_id;
}

export function collectUserIds(notifications) {
  const ids = new Set();
  for (const n of notifications) {
    const m = n.metadata;
    if (!m) continue;
    if (m.requester_id) ids.add(m.requester_id);
    if (m.poster_id) ids.add(m.poster_id);
    if (m.reviewer_id) ids.add(m.reviewer_id);
    if (m.other_user_id) ids.add(m.other_user_id);
  }
  return [...ids];
}
