import { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { logout } from "../../lib/auth";
import { useModalParam, safeAppReturnTo } from "../../hooks/useModalParam";
import { getLevel, useTimer } from "../../utils/helpers";
import { getGigById } from "../../lib/profile";
import { queryClient, queryKeys, GIG_DETAIL_STALE_MS } from "../../lib/queryClient";
import TopBar from "../../components/TopBar";
import ReviewSheetModal from "../../components/modals/ReviewSheetModal";
import DeleteReviewConfirmModal from "../../components/modals/DeleteReviewConfirmModal";
import GigDetailModal from "../../components/modals/GigDetailModal";
import { useProfilePageQueries } from "./hooks/useProfilePageQueries";
import { useProfileMenu } from "./hooks/useProfileMenu";
import { useProfileReviewsUrlSync } from "./hooks/useProfileReviewsUrlSync";
import { buildProfileActivityItems } from "./mappers/buildProfileActivityItems";
import { buildOtherUserActivityItems } from "./mappers/buildOtherUserActivityItems";
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
import ProfileOtherActivityTab from "./components/ProfileOtherActivityTab";

export default function ProfilePage({ currentUserId }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId: routeUserId } = useParams();
  const isOtherProfile = Boolean(routeUserId);

  const profileBackTarget = safeAppReturnTo(location.state);
  const [repOpen, openRep, closeRep] = useModalParam("rep");
  const [reviewsOpen, openReviews, closeReviews] = useModalParam("reviews");
  const [gigParam, openGig, closeGig] = useModalParam("gig");

  const [pTab, setPTab] = useState(() => (routeUserId ? "reviews" : "activity"));
  const [loggingOut, setLoggingOut] = useState(false);
  const [selectedGigId, setSelectedGigId] = useState(null);
  const [targetReviewerId, setTargetReviewerId] = useState(null);

  const [reviewForm, setReviewForm] = useState(null);
  const [settingsMenuReviewId, setSettingsMenuReviewId] = useState(null);
  const [deleteConfirmReviewId, setDeleteConfirmReviewId] = useState(null);

  const menu = useProfileMenu();
  useProfileReviewsUrlSync({
    locationSearch: location.search,
    reviewsOpen,
    openReviews,
    setTargetReviewerId,
  });

  const q = useProfilePageQueries(routeUserId);

  const { data: modalGig, isPending: gigModalPending } = useQuery({
    queryKey: queryKeys.gigById(gigParam),
    queryFn: async () => {
      const { gig } = await getGigById(gigParam);
      return gig ?? null;
    },
    enabled: Boolean(gigParam && isOtherProfile),
    staleTime: GIG_DETAIL_STALE_MS,
  });

  const tick = useTimer();

  useEffect(() => {
    if (!gigParam || !isOtherProfile) return;
    if (!gigModalPending && modalGig === null) closeGig();
  }, [gigParam, gigModalPending, modalGig, closeGig, isOtherProfile]);

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

  const activityItemsSelf = buildProfileActivityItems(q.activity);
  const activityItemsOther = buildOtherUserActivityItems(q.userActivity);

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
                openRep={openRep}
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
                myReviewsToThem={q.myReviewsToThem}
                openReviews={openReviews}
                setReviewForm={setReviewForm}
                settingsMenuReviewId={settingsMenuReviewId}
                setSettingsMenuReviewId={setSettingsMenuReviewId}
                setDeleteConfirmReviewId={setDeleteConfirmReviewId}
              />
            )}

            {pTab === "activity" && (
              <ProfileOtherActivityTab activityItems={activityItemsOther} openGig={openGig} />
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
            pendingGigId={q.firstPendingGigId}
            hasPendingReview={q.hasPendingReview}
            myReviewsToThem={q.myReviewsToThem}
            reviewForm={reviewForm}
            setReviewForm={setReviewForm}
            onReviewSubmitted={() => {
              closeReviews();
              setReviewForm(null);
              refreshOtherProfile();
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
        {gigParam && (modalGig != null || gigModalPending) && (
          <GigDetailModal
            gig={modalGig}
            loading={gigModalPending && modalGig == null}
            tick={tick}
            requested={false}
            onRequest={() => {}}
            onClose={closeGig}
            onViewProfile={(uid) => {
              const qStr = gigParam ? `?gig=${encodeURIComponent(gigParam)}` : "";
              navigate(`/profile/${uid}`, { state: { returnTo: `/profile/${routeUserId}${qStr}` } });
            }}
            currentUserId={currentUserId}
            onGigDeleted={() => {
              refreshOtherProfile();
              queryClient.invalidateQueries({ queryKey: queryKeys.gigById(gigParam) });
            }}
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

            <ProfileRepCard repScore={repScore} lvl={lvl} rank={q.rank} totalUsers={q.totalUsers} openRep={openRep} />
          </div>

          <ProfileTabBar variant="self" pTab={pTab} setPTab={setPTab} />

          {pTab === "activity" && (
            <ProfileActivityTab
              activityItems={activityItemsSelf}
              activityLoading={q.activityPending}
              navigate={navigate}
              setSelectedGigId={setSelectedGigId}
            />
          )}

          {pTab === "leaderboard" && (
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
        repOpen={repOpen}
        closeRep={closeRep}
        repScore={repScore}
        selectedGigId={selectedGigId}
        onCloseGigModal={() => {
          setSelectedGigId(null);
          refreshProfileData();
        }}
        onGigStatusChange={refreshProfileData}
      />
    </>
  );
}
