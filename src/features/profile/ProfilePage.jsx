import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation, useParams, useSearchParams } from "react-router-dom";
import { logout } from "../../lib/auth";
import { useModalParam, safeAppReturnTo } from "../../hooks/useModalParam";
import { getLevel } from "../../utils/helpers";
import { queryClient, queryKeys } from "../../lib/queryClient";
import TopBar from "../../components/TopBar";
import ReviewSheetModal from "../../components/modals/ReviewSheetModal";
import DeleteReviewConfirmModal from "../../components/modals/DeleteReviewConfirmModal";
import { useProfilePageQueries } from "./hooks/useProfilePageQueries";
import { useProfileMenu } from "./hooks/useProfileMenu";
import { useProfileReviewsUrlSync } from "./hooks/useProfileReviewsUrlSync";
import { buildActivityItems } from "./mappers/buildProfileActivityItems";
import { refreshProfileData } from "./utils/refreshProfileData";
import ProfilePageSkeleton from "./components/ProfilePageSkeleton";
import ProfileNotFound from "./components/ProfileNotFound";
import ProfileTopBar from "./components/ProfileTopBar";
import ProfileSettingsMenu from "./components/ProfileSettingsMenu";
import ProfileHeaderSection from "./components/ProfileHeaderSection";
import ProfileStatBoxes from "./components/ProfileStatBoxes";
import ProfileRepCard from "./components/ProfileRepCard";
import ProfileTabBar from "./components/ProfileTabBar";
import ProfileActivityTab from "./components/ProfileActivityTab";
import ProfileLeaderboardTab from "./components/ProfileLeaderboardTab";
import ProfileModals from "./components/ProfileModals";
import ProfileOtherReviewsTab from "./components/ProfileOtherReviewsTab";
import ReportModal from "../../components/modals/ReportModal";
import { useLegacyGigRedirect } from "../../hooks/useLegacyGigRedirect";
import { usePasscodeSetupPrompt } from "../auth/hooks/usePasscodeSetupPrompt";
import PasscodeSetupPromptModal from "../../components/auth/PasscodeSetupPromptModal";
import SetPasscodeModal from "../../components/auth/SetPasscodeModal";
import { useToast } from "../../components/toast/ToastProvider";

// Remembers the last self-profile tab (Activity vs Board) across navigations —
// e.g. open a profile from the Board and come back to the Board, not Activity.
const PROFILE_TAB_STORAGE_KEY = "cg:profile:selfTab";
const SELF_TABS = new Set(["activity", "leaderboard"]);

export default function ProfilePage({ currentUserId }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId: routeUserId } = useParams();
  const isOtherProfile = Boolean(routeUserId);

  const profileBackTarget = safeAppReturnTo(location.state);
  const [reviewsOpen, openReviews, closeReviews] = useModalParam("reviews");
  const [searchParams] = useSearchParams();

  const [pTab, setPTab] = useState(() => {
    if (routeUserId) return "reviews";
    try {
      if (new URLSearchParams(window.location.search).get("tab") === "leaderboard") return "leaderboard";
    } catch {
      /* ignore */
    }
    try {
      const saved = localStorage.getItem(PROFILE_TAB_STORAGE_KEY);
      if (SELF_TABS.has(saved)) return saved;
    } catch {
      /* ignore */
    }
    return "activity";
  });
  const [loggingOut, setLoggingOut] = useState(false);
  const [targetReviewerId, setTargetReviewerId] = useState(null);
  const [deepLinkGigId, setDeepLinkGigId] = useState(null);

  const [reviewForm, setReviewForm] = useState(null);
  const [settingsMenuReviewId, setSettingsMenuReviewId] = useState(null);
  const [deleteConfirmReviewId, setDeleteConfirmReviewId] = useState(null);
  const [bugReportOpen, setBugReportOpen] = useState(false);
  const [supportReportOpen, setSupportReportOpen] = useState(false);

  const menu = useProfileMenu();
  useProfileReviewsUrlSync({
    locationSearch: location.search,
    reviewsOpen,
    openReviews,
    setTargetReviewerId,
    setDeepLinkGigId,
  });

  const q = useProfilePageQueries(routeUserId);
  const { showToast } = useToast();

  const passcodePrompt = usePasscodeSetupPrompt({
    enabled: !routeUserId && !q.loading && !!q.profile,
    profile: q.profile,
  });

  const effectivePendingGigId = useMemo(() => {
    if (!routeUserId) return null;
    const eligible = q.eligiblePendingGigIds || [];
    if (deepLinkGigId && eligible.includes(deepLinkGigId)) return deepLinkGigId;
    return q.firstPendingGigId ?? null;
  }, [routeUserId, q.firstPendingGigId, q.eligiblePendingGigIds, deepLinkGigId]);

  useEffect(() => {
    if (searchParams.get("rep") && !isOtherProfile) {
      navigate("/profile/rep", { replace: true, state: { returnTo: "/profile" } });
    }
  }, [searchParams, navigate, isOtherProfile]);

  useEffect(() => {
    if (routeUserId) return;
    if (searchParams.get("tab") === "leaderboard") setPTab("leaderboard");
  }, [searchParams, routeUserId]);

  // Remember the self-profile tab so returning to /profile restores it.
  useEffect(() => {
    if (routeUserId || !SELF_TABS.has(pTab)) return;
    try {
      localStorage.setItem(PROFILE_TAB_STORAGE_KEY, pTab);
    } catch {
      /* ignore */
    }
  }, [pTab, routeUserId]);

  useEffect(() => {
    if (routeUserId || pTab !== "leaderboard" || searchParams.get("tab") !== "leaderboard") return;
    const id = requestAnimationFrame(() => {
      document.getElementById("profile-leaderboard-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => cancelAnimationFrame(id);
  }, [routeUserId, pTab, searchParams]);

  useLegacyGigRedirect(routeUserId ? `/profile/${routeUserId}` : "/profile", {
    enabled: isOtherProfile && Boolean(routeUserId),
    skipWhenReviews: true,
  });

  if (q.loading) {
    return <ProfilePageSkeleton variant={isOtherProfile ? "other" : "self"} />;
  }
  if (!q.profile) {
    return <ProfileNotFound variant={isOtherProfile ? "other" : "self"} />;
  }

  const repScore = q.profile.rep_score || 0;
  const lvl = getLevel(repScore);
  const fullName = `${q.profile.first_name || ""} ${q.profile.last_name || ""}`.trim();
  const avgRatingNum =
    q.reviews.length > 0 ? q.reviews.reduce((sum, r) => sum + r.rating, 0) / q.reviews.length : 0;
  const avgRatingSelfDisplay =
    q.reviews.length > 0
      ? (q.reviews.reduce((sum, r) => sum + r.rating, 0) / q.reviews.length).toFixed(1)
      : "0.0";

  const activityItemsSelf = buildActivityItems(q.activity, { perspective: "self" });
  const activityItemsOther = buildActivityItems(q.userActivity, { perspective: "other" });

  async function handleLogout() {
    menu.setProfileMenuOpen(false);
    setLoggingOut(true);
    await logout();
  }

  function refreshOtherProfile() {
    if (routeUserId) refreshProfileData(routeUserId);
  }

  if (isOtherProfile) {
    return (
      <>
        <div className="page fadein">
          <TopBar title={fullName} />

          <div className="scroll scroll--nav-pad scroll--fine-scrollbar">
            <div style={{ padding: "20px 16px 0" }}>
              <ProfileHeaderSection
                profile={q.profile}
                avatarUrl={q.avatarUrl}
                fullName={fullName}
                lvl={lvl}
                avgRating={avgRatingNum.toFixed(1)}
                reviews={q.reviews}
                openReviews={openReviews}
                reviewsLoading={false}
                isOwnProfile={false}
                hasPendingReview={q.hasPendingReview}
                myReviewsToThemLength={q.myReviewsToThem.length}
              />

              <ProfileStatBoxes
                gigStats={q.gigStats}
                rank={q.rank}
                totalUsers={q.totalUsers}
                setPTab={setPTab}
                isOwnProfile={false}
              />

              <ProfileRepCard
                repScore={repScore}
                lvl={lvl}
                rank={q.rank}
                totalUsers={q.totalUsers}
                variant="other"
              />
            </div>

            <ProfileTabBar variant="other" pTab={pTab} setPTab={setPTab} />

            {pTab === "reviews" && (
              <ProfileOtherReviewsTab
                reviews={q.reviews}
                avgRatingNum={avgRatingNum}
                fullName={fullName}
                currentUserId={currentUserId}
                hasPendingReview={q.hasPendingReview}
                hasExpiredReviewOpportunity={q.hasExpiredReviewOpportunity}
                myReviewsToThem={q.myReviewsToThem}
                openReviews={openReviews}
                setReviewForm={setReviewForm}
                settingsMenuReviewId={settingsMenuReviewId}
                setSettingsMenuReviewId={setSettingsMenuReviewId}
                setDeleteConfirmReviewId={setDeleteConfirmReviewId}
              />
            )}

            {pTab === "activity" && (
              <ProfileActivityTab
                activityItems={activityItemsOther}
                navigate={navigate}
                returnToPath={`/profile/${routeUserId}`}
                emptyMessage="No activity yet."
              />
            )}

            <div style={{ height: 32 }} />
          </div>
        </div>

        {reviewsOpen && (
          <ReviewSheetModal
            onClose={() => {
              closeReviews();
              setReviewForm(null);
            }}
            reviews={q.reviews}
            avgRating={avgRatingNum}
            reviewCount={q.reviews.length}
            isOwnProfile={false}
            currentUserId={currentUserId}
            revieweeId={routeUserId}
            pendingGigId={effectivePendingGigId}
            hasPendingReview={q.hasPendingReview}
            hasExpiredReviewOpportunity={q.hasExpiredReviewOpportunity}
            myReviewsToThem={q.myReviewsToThem}
            reviewForm={reviewForm}
            setReviewForm={setReviewForm}
            onReviewSubmitted={() => {
              closeReviews();
              setReviewForm(null);
              refreshOtherProfile();
              if (effectivePendingGigId) {
                queryClient.invalidateQueries({ queryKey: queryKeys.gigDetail(effectivePendingGigId) });
              }
              if (effectivePendingGigId && routeUserId) {
                queryClient.invalidateQueries({
                  queryKey: queryKeys.existingReview(effectivePendingGigId, routeUserId),
                });
              }
            }}
            onReviewerPress={(reviewerId) => {
              setReviewForm(null);
              navigate(`/profile/${reviewerId}`, {
                state: { returnTo: `/profile/${routeUserId}` },
              });
            }}
          />
        )}
        {deleteConfirmReviewId && (
          <DeleteReviewConfirmModal
            reviewId={deleteConfirmReviewId}
            gigTitle={q.myReviewsToThem.find((x) => x.id === deleteConfirmReviewId)?.gig_title}
            onClose={() => setDeleteConfirmReviewId(null)}
            onDeleted={() => refreshOtherProfile()}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="page fadein">
        <div className="topbar">
          <ProfileTopBar profileBackTarget={profileBackTarget} navigate={navigate} />
          <ProfileSettingsMenu
            navigate={navigate}
            onLogout={handleLogout}
            loggingOut={loggingOut}
            profileMenuRef={menu.profileMenuRef}
            profileMenuOpen={menu.profileMenuOpen}
            setProfileMenuOpen={menu.setProfileMenuOpen}
            profileMenuShow={menu.profileMenuShow}
            profileMenuLeave={menu.profileMenuLeave}
            handleProfileMenuAnimationEnd={menu.handleProfileMenuAnimationEnd}
            toggleProfileMenu={menu.toggleProfileMenu}
            onOpenBugReport={() => setBugReportOpen(true)}
            onOpenSupportReport={() => setSupportReportOpen(true)}
          />
        </div>

        <div className="scroll scroll--nav-pad scroll--fine-scrollbar">
          <div style={{ padding: "20px 16px 0" }}>
            <ProfileHeaderSection
              profile={q.profile}
              avatarUrl={q.avatarUrl}
              fullName={fullName}
              lvl={lvl}
              avgRating={avgRatingSelfDisplay}
              reviews={q.reviews}
              openReviews={openReviews}
              reviewsLoading={q.reviewsPending}
              isOwnProfile
            />

            <ProfileStatBoxes
              gigStats={q.gigStats}
              rank={q.rank}
              totalUsers={q.totalUsers}
              setPTab={setPTab}
              isOwnProfile
            />

            <ProfileRepCard
              repScore={repScore}
              lvl={lvl}
              rank={q.rank}
              totalUsers={q.totalUsers}
              onRepPath={() => navigate("/profile/rep", { state: { returnTo: "/profile" } })}
            />
          </div>

          <ProfileTabBar variant="self" pTab={pTab} setPTab={setPTab} />

          {pTab === "activity" && (
            <ProfileActivityTab
              activityItems={activityItemsSelf}
              activityLoading={q.activityPending}
              navigate={navigate}
            />
          )}

          {pTab === "leaderboard" && (
            <div id="profile-leaderboard-section">
              <ProfileLeaderboardTab
                leaderboard={q.leaderboard}
                totalUsers={q.totalUsers}
                rank={q.rank}
                profile={q.profile}
                avatarUrl={q.avatarUrl}
                fullName={fullName}
                lvl={lvl}
                repScore={repScore}
                navigate={navigate}
              />
            </div>
          )}

          <div style={{ height: 16 }} />
        </div>
      </div>

      <ProfileModals
        reviewsOpen={reviewsOpen}
        onCloseReviews={() => {
          closeReviews();
          setTargetReviewerId(null);
        }}
        reviews={q.reviews}
        avgRating={avgRatingSelfDisplay}
        currentUserId={currentUserId}
        targetReviewerId={targetReviewerId}
        onReviewerPress={(reviewerId) => {
          setTargetReviewerId(null);
          navigate(`/profile/${reviewerId}`, { state: { returnTo: "/profile" } });
        }}
      />
      {bugReportOpen && (
        <ReportModal
          subjectType="BugReport"
          initialPagePath={location.pathname}
          onClose={() => setBugReportOpen(false)}
        />
      )}
      {supportReportOpen && (
        <ReportModal subjectType="SupportReport" onClose={() => setSupportReportOpen(false)} />
      )}
      {passcodePrompt.promptOpen ? (
        <PasscodeSetupPromptModal
          onClose={passcodePrompt.handleAskLater}
          onSetPasscode={passcodePrompt.openSetPasscode}
          onAskLater={passcodePrompt.handleAskLater}
          onDontAskAgain={passcodePrompt.handleDontAskAgain}
        />
      ) : null}
      {passcodePrompt.setPasscodeOpen ? (
        <SetPasscodeModal
          onClose={passcodePrompt.closeSetPasscode}
          onSuccess={() => {
            passcodePrompt.handlePasscodeSaved();
            showToast({ title: "Passcode saved", body: "Sign in faster next time with your 6-digit code." });
          }}
        />
      ) : null}
    </>
  );
}
