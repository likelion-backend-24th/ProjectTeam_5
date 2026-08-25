"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { requestIssueBillingKey } from "@portone/browser-sdk/v2";
import { getMentorPlans } from "@/lib/mentorPlans";
import { subscribeToMentor } from "@/lib/subscriptions";
import { prepareBillingKeyIssuance, registerPaymentMethod } from "@/lib/payments";
import { getOrCreateChatRoom } from "@/lib/chat";
import { getAccessToken } from "@/lib/tokenStore";
import { API_URL as BACKEND_URL } from "@/lib/client";
import { useToast } from "@/app/contexts/ToastContext";
import ConfirmDialog from "@/components/modal/ConfirmDialog";
import { checkIsAvailable, buildAuthHeaders, MAX_BIO_LENGTH } from "./utils";
import ProfileHero from "./components/ProfileHero";
import WritePostForm from "./components/WritePostForm";
import ArticleCard from "./components/ArticleCard";
import ReviewSection from "./components/ReviewSection";
import SubscriptionSidebarCard from "./components/SubscriptionSidebarCard";
import MentorInfoCard from "./components/MentorInfoCard";
import ScheduleCard from "./components/ScheduleCard";
import SubscribeModal from "./components/SubscribeModal";
import CardRegistrationModal from "./components/CardRegistrationModal";
import styles from "./page.module.css";
import { normalizeCategories } from "@/constants/mentorOptions";

export default function MentorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const mentorId = params?.mentorId || params?.id;

  const { user: authUser, isLoggedIn } = useAuth();
  const currentUserId = authUser?.id || authUser?.userId;
  const { showToast } = useToast();

  const [requestingConsult, setRequestingConsult] = useState(false);

  // confirm() 게이트(구독 해지) 대체용 상태. 리뷰 삭제 확인은 components/ReviewSection.jsx가 자체적으로 갖고 있다.
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelingSubscription, setCancelingSubscription] = useState(false);

  const [mentorInfo, setMentorInfo] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("feed");
  const [filter, setFilter] = useState("all");
  const [searchText, setSearchText] = useState("");

  const [isOwner, setIsOwner] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState(null);

  const [plans, setPlans] = useState([]);
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);
  const [subscribing, setSubscribing] = useState(false);

  const [showSubscribeModal, setShowSubscribeModal] = useState(false);

  // 카드 미등록 상태에서 구독 시 그 자리에서 카드 등록을 이어서 받기 위한 상태
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardPhoneNumber, setCardPhoneNumber] = useState("");
  const [registeringCard, setRegisteringCard] = useState(false);
  const [cardError, setCardError] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [profileSnapshot, setProfileSnapshot] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [editForm, setEditForm] = useState({
    bio: "",
    company: "",
    career: "",
    tags: "",
    education: "",
    schedule: "",
    portfolioUrl: "",
  });

  // components/WritePostForm.jsx는 이 값이 true일 때만 마운트된다 — 그래서 "작성 취소"를 누르면
  // 폼 내부 상태(제목/내용/첨부파일 등)가 통째로 사라지고, 다시 열면 항상 빈 폼으로 시작한다.
  const [isWritingPost, setIsWritingPost] = useState(false);

  const fetchArticles = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/mentors/${mentorId}/posts`);
      if (res.ok) {
        const data = await res.json();
        setArticles(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 리뷰 등록/삭제 후 히어로에 보이는 rating/reviewCount를 갱신하기 위해 ReviewSection에 넘긴다.
  const refreshMentorStats = async () => {
    const refreshed = await fetch(`${BACKEND_URL}/api/mentors/${mentorId}`).then((r) => (r.ok ? r.json() : null));
    if (refreshed) setMentorInfo((prev) => ({ ...prev, ...refreshed }));
  };

  useEffect(() => {
    if (!mentorId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const token = getAccessToken();
        const headers = buildAuthHeaders({ token, userId: currentUserId, json: true });

        const profileRes = await fetch(`${BACKEND_URL}/api/mentors/${mentorId}`, { method: "GET", headers });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setMentorInfo(profileData);
          setEditForm({
            bio: profileData.bio || "",
            company: profileData.company || "",
            career: profileData.career || "",
            tags: profileData.tags || "",
            education: profileData.education || "",
            schedule: profileData.schedule || "월(10:00 - 17:00), 수(10:00 - 17:00), 금(10:00 - 17:00)",
            portfolioUrl: profileData.portfolioUrl || "",
          });
          setIsOwner(Boolean(isLoggedIn && currentUserId && profileData.mentorId && String(profileData.mentorId) === String(currentUserId)));
        }

        const articlesRes = await fetch(`${BACKEND_URL}/api/v1/mentors/${mentorId}/posts`, { method: "GET", headers });
        if (articlesRes.ok) {
          const articlesData = await articlesRes.json();
          setArticles(articlesData);
        }

        try {
          const planData = await getMentorPlans(mentorId);
          setPlans(Array.isArray(planData) ? planData : []);
          setSelectedPlanIndex(0);
        } catch (planErr) {
          console.error("요금제 목록 조회 실패:", planErr);
        }

        if (isLoggedIn && currentUserId) {
          try {
            const checkRes = await fetch(`${BACKEND_URL}/api/v1/subscriptions/check?mentorId=${mentorId}`, { method: "GET", headers });
            if (checkRes.ok) {
              const checkData = await checkRes.json();
              if (checkData.status) setSubscriptionStatus(checkData.status);
              if (checkData.currentPeriodEnd) setCurrentPeriodEnd(checkData.currentPeriodEnd);
            }

            const mySubsRes = await fetch(`${BACKEND_URL}/api/v1/subscriptions/me`, { method: "GET", headers });
            if (mySubsRes.ok) {
              const mySubs = await mySubsRes.json();
              const currentSub = mySubs.find((sub) => String(sub.mentorId) === String(mentorId));
              if (currentSub) {
                setSubscriptionId(currentSub.subscriptionId);
                const subStatus = currentSub.status;
                const periodEnd = currentSub.currentPeriodEnd || currentSub.current_period_end;
                setSubscriptionStatus(subStatus);
                setCurrentPeriodEnd(periodEnd);

                const now = new Date();
                const endDate = periodEnd ? new Date(periodEnd) : null;
                const isValidActive = subStatus === "ACTIVE";
                const isCancelReservedButValid = subStatus === "CANCEL_RESERVED" && (!endDate || endDate > now);
                setIsSubscribed(isValidActive || isCancelReservedButValid);
              }
            }
          } catch (subErr) {
            console.error("구독 정보 로드 실패:", subErr);
          }
        }
      } catch (error) {
        console.error("데이터 로드 오류:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [mentorId, isLoggedIn, authUser, currentUserId]);

  const selectedPlan = plans[selectedPlanIndex] || null;

  const showPrevPlan = () => {
    setSelectedPlanIndex((i) => (plans.length === 0 ? 0 : (i - 1 + plans.length) % plans.length));
  };

  const showNextPlan = () => {
    setSelectedPlanIndex((i) => (plans.length === 0 ? 0 : (i + 1) % plans.length));
  };

  const handleSubscribe = async () => {
    if (!isLoggedIn) {
      showToast("로그인이 필요한 서비스입니다.", "error");
      return;
    }
    if (!selectedPlan) {
      showToast("구독할 요금제를 선택해주세요.", "error");
      return;
    }
    if (subscribing) return;

    setSubscribing(true);
    try {
      const completeRes = await subscribeToMentor(mentorId, selectedPlan.id);

      if (completeRes.subscriptionStatus === "ACTIVE") {
        setIsSubscribed(true);
        setSubscriptionId(completeRes.subscriptionId);
        setSubscriptionStatus("ACTIVE");
        setCurrentPeriodEnd(completeRes.currentPeriodEnd);

        setMentorInfo((prev) => ({
          ...prev,
          subscriberCount: (prev.subscriberCount || 0) + 1,
        }));

        setShowSubscribeModal(false);
        showToast("멘토 구독이 완료되었습니다!", "success");
      } else {
        showToast("결제 검증에 실패했습니다. 잠시 후 다시 시도해주세요.", "error");
      }
    } catch (e) {
      console.error(e);
      // ⚠️ 백엔드 ErrorResponse 필드명은 errorCode가 아니라 code다 (GlobalExceptionHandler 확인).
      if (e.data?.code === "PAYMENT_METHOD_REQUIRED") {
        setCardError("");
        setShowCardModal(true);
        return;
      }
      showToast(e.message || "구독 결제 중 오류가 발생했습니다.", "error");
    } finally {
      setSubscribing(false);
    }
  };

  // 카드 등록 모달에서 "등록하고 구독하기"를 눌렀을 때: 카드 등록(빌링키 발급) → 성공하면 곧바로 구독 재시도.
  // 별도 페이지 이동 없이 한 흐름으로 이어지도록, 등록만 하고 실제 청구는 handleSubscribe를 다시 호출해 그대로 재사용한다.
  const handleRegisterCardAndSubscribe = async () => {
    if (!/^01[0-9]{8,9}$/.test(cardPhoneNumber.trim())) {
      setCardError("올바른 휴대폰 번호를 입력해주세요. (예: 01012345678)");
      return;
    }
    setCardError("");
    setRegisteringCard(true);

    try {
      const prepareRes = await prepareBillingKeyIssuance();

      const issueResult = await requestIssueBillingKey({
        storeId: prepareRes.storeId,
        channelKey: prepareRes.channelKey,
        billingKeyMethod: "CARD",
        issueId: prepareRes.issueId,
        issueName: "MentorBridge 결제수단 등록",
        customer: {
          fullName: authUser?.name,
          phoneNumber: cardPhoneNumber.trim(),
          email: authUser?.email,
        },
      });

      if (issueResult?.code) {
        // 사용자가 카드 등록창을 닫았거나 PG 승인이 거부된 경우
        setCardError(issueResult.message || "카드 등록이 취소되었습니다.");
        return;
      }

      await registerPaymentMethod({
        cardNickname: "기본 카드",
        issueId: prepareRes.issueId,
        billingKey: issueResult.billingKey,
        phoneNumber: cardPhoneNumber.trim(),
      });

      setShowCardModal(false);
      setCardPhoneNumber("");
      await handleSubscribe(); // 카드 등록 성공 → 이어서 첫 결제(구독) 진행
    } catch (err) {
      setCardError(err.message || "카드 등록에 실패했습니다.");
    } finally {
      setRegisteringCard(false);
    }
  };

  const handleCancelSubscription = () => {
    if (subscriptionStatus === "CANCEL_RESERVED") {
      const endDateStr = currentPeriodEnd ? new Date(currentPeriodEnd).toLocaleDateString() : "기간 만료일";
      showToast(`이미 해지 예약된 구독입니다.\n${endDateStr}까지는 정상적으로 혜택을 이용하실 수 있습니다.`, "info");
      return;
    }

    if (!subscriptionId) {
      showToast("구독 정보를 찾을 수 없습니다.", "error");
      return;
    }

    setShowCancelConfirm(true);
  };

  const confirmCancelSubscription = async () => {
    const endDateStr = currentPeriodEnd ? new Date(currentPeriodEnd).toLocaleDateString() : "기간 만료일";
    setCancelingSubscription(true);
    try {
      const token = getAccessToken();
      const res = await fetch(`${BACKEND_URL}/api/v1/subscriptions/${subscriptionId}/cancel`, {
        method: "PATCH",
        headers: buildAuthHeaders({ token, userId: currentUserId }),
      });

      if (res.ok) {
        setSubscriptionStatus("CANCEL_RESERVED");
        setShowCancelConfirm(false);
        showToast(`구독이 해지 예약되었습니다. ${endDateStr}까지 혜택이 유지됩니다.`, "success");
      } else {
        showToast("구독 해지에 실패했습니다.", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("서버 오류가 발생했습니다.", "error");
    } finally {
      setCancelingSubscription(false);
    }
  };

  const handleConsultRequest = async () => {
    if (!isLoggedIn) {
      showToast("로그인이 필요한 서비스입니다.", "error");
      router.push("/login");
      return;
    }

    if (!isAccessValid) {
      setShowSubscribeModal(true);
      return;
    }

    try {
      setRequestingConsult(true);
      const room = await getOrCreateChatRoom(mentorId);
      router.push(`/chat/${room.chatRoomId}`);
    } catch (err) {
      showToast(err.message || "채팅방을 시작하지 못했습니다.", "error");
    } finally {
      setRequestingConsult(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleScheduleChange = (nextScheduleStr) => {
    setEditForm((prev) => ({ ...prev, schedule: nextScheduleStr }));
  };

  const handleSaveProfile = async () => {
    if (!editForm.bio.trim()) {
      showToast("소개글을 입력해주세요.", "error");
      return;
    }
    if (editForm.bio.length > MAX_BIO_LENGTH) {
      showToast(`소개글은 ${MAX_BIO_LENGTH}자 이내로 작성해주세요.`, "error");
      return;
    }

    const normalizedForm = {
      ...editForm,
      bio: editForm.bio.trim(),
      company: editForm.company.trim(),
      career: editForm.career.trim(),
      tags: normalizeCategories(editForm.tags).join(", "),
      education: editForm.education.trim(),
      schedule: editForm.schedule.trim(),
    };

    try {
      setSavingProfile(true);
      const token = getAccessToken();
      const res = await fetch(`${BACKEND_URL}/api/mentors/${mentorId}`, {
        method: "PUT",
        headers: buildAuthHeaders({ token, userId: currentUserId, json: true }),
        body: JSON.stringify(normalizedForm),
      });

      if (res.ok) {
        const updatedData = await res.json().catch(() => ({}));
        setMentorInfo((prev) => ({
          ...prev,
          ...normalizedForm,
          ...updatedData,
        }));
        setProfileSnapshot(null);
        setIsEditing(false);
        showToast("프로필이 성공적으로 수정되었습니다.", "success");
      } else {
        const error = await res.json().catch(() => ({}));
        showToast(error.message || "프로필 수정에 실패했습니다.", "error");
      }
    } catch (error) {
      console.error("프로필 수정 오류:", error);
      showToast("서버 연결에 실패했습니다. 다시 시도해주세요.", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const startProfileEdit = () => {
    const snapshot = { ...editForm, tags: editForm.tags || "", schedule: editForm.schedule || "" };
    setProfileSnapshot(snapshot);
    setIsEditing(true);
  };

  const cancelProfileEdit = () => {
    if (profileSnapshot) setEditForm(profileSnapshot);
    setProfileSnapshot(null);
    setIsEditing(false);
  };

  // WritePostForm이 게시글 생성에 성공하면 호출된다 — 응답에 새 게시글이 그대로 들어있으면 목록 맨 앞에
  // 바로 얹고, 아니면(백엔드 응답 형태가 다를 때 대비) 잠깐 뒤에 목록을 다시 불러온다.
  const handlePostCreated = (newPostData) => {
    if (newPostData && newPostData.id) {
      setArticles((prev) => [newPostData, ...prev]);
    } else {
      setTimeout(() => {
        fetchArticles();
      }, 200);
    }
    setIsWritingPost(false);
  };

  if (loading) return <div className={styles.loading}>로딩 중...</div>;
  if (!mentorInfo) return <div className={styles.error}>멘토 정보를 찾을 수 없습니다.</div>;

  const tagsArray = mentorInfo.tags ? mentorInfo.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
  const isAccessValid = isSubscribed || (subscriptionStatus === "CANCEL_RESERVED" && (!currentPeriodEnd || new Date(currentPeriodEnd) > new Date()));
  const currentPrice = selectedPlan ? Number(selectedPlan.price).toLocaleString() : "-";
  const isAvailableNow = checkIsAvailable(mentorInfo.schedule);

  const filteredArticles = [...articles]
    .filter((article) => {
      if (!searchText.trim()) return true;
      const keyword = searchText.toLowerCase().trim();
      return article.title?.toLowerCase().includes(keyword) || article.content?.toLowerCase().includes(keyword);
    })
    .sort((a, b) => {
      if (filter === "popular") return (b.likeCount ?? 0) - (a.likeCount ?? 0);
      if (filter === "latest") {
        return new Date(b.createdAt || b.updatedAt || 0).getTime() - new Date(a.createdAt || a.updatedAt || 0).getTime();
      }
      return 0;
    });

  return (
    <div className={styles.container}>
      <ProfileHero
        mentorInfo={mentorInfo}
        tagsArray={tagsArray}
        articlesCount={articles.length}
        isAvailableNow={isAvailableNow}
        isEditing={isEditing}
        editForm={editForm}
        onChange={handleInputChange}
        onStartEdit={startProfileEdit}
        onCancelEdit={cancelProfileEdit}
        onSaveProfile={handleSaveProfile}
        savingProfile={savingProfile}
        isOwner={isOwner}
        isSubscribed={isSubscribed}
        subscriptionStatus={subscriptionStatus}
        currentPeriodEnd={currentPeriodEnd}
        onCancelSubscription={handleCancelSubscription}
        onOpenSubscribeModal={() => setShowSubscribeModal(true)}
        onConsultRequest={handleConsultRequest}
        requestingConsult={requestingConsult}
      />

      <div className={styles.tabNav}>
        <button className={activeTab === "feed" ? styles.activeTab : ""} onClick={() => setActiveTab("feed")}>피드</button>
        <button className={activeTab === "info" ? styles.activeTab : ""} onClick={() => setActiveTab("info")}>소개</button>
        <button className={activeTab === "review" ? styles.activeTab : ""} onClick={() => setActiveTab("review")}>리뷰</button>
      </div>

      <div className={styles.mainGrid}>
        <main className={styles.feedColumn}>
          {activeTab === "feed" && (
            <>
              {isOwner && (
                <div className={styles.writePostBar}>
                  <button className={styles.editBtn} onClick={() => setIsWritingPost((prev) => !prev)}>
                    {isWritingPost ? "작성 취소" : "✏️ 새 게시글 작성"}
                  </button>
                </div>
              )}

              {isWritingPost && (
                <WritePostForm mentorId={mentorId} currentUserId={currentUserId} onCreated={handlePostCreated} />
              )}

              <div className={styles.filterBar}>
                <div className={styles.filterGroup}>
                  <button className={filter === "all" ? styles.activeFilter : ""} onClick={() => setFilter("all")}>전체</button>
                  <button className={filter === "popular" ? styles.activeFilter : ""} onClick={() => setFilter("popular")}>인기순</button>
                  <button className={filter === "latest" ? styles.activeFilter : ""} onClick={() => setFilter("latest")}>최신순</button>
                </div>
                <div className={styles.searchWrapper}>
                  <input type="text" placeholder="게시글 검색" value={searchText} onChange={(e) => setSearchText(e.target.value)} className={styles.searchInput} />
                  <span>🔍</span>
                </div>
              </div>

              <div className={styles.articleArea}>
                <div className={styles.articleList}>
                  {filteredArticles.length === 0 ? (
                    <div className={styles.empty}>등록된 게시글이 없습니다.</div>
                  ) : (
                    filteredArticles.map((article, index) => (
                      <ArticleCard
                        key={article.id}
                        article={article}
                        index={index}
                        mentorId={mentorId}
                        isOwner={isOwner}
                        isAccessValid={isAccessValid}
                        onLockedClick={() => setShowSubscribeModal(true)}
                      />
                    ))
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === "info" && (
            <div className={styles.empty}>
              <h3>멘토 소개</h3>
              <p className={styles.infoTabBio}>{mentorInfo.bio || "상세 소개 내용이 없습니다."}</p>
            </div>
          )}

          {activeTab === "review" && (
            <ReviewSection
              mentorId={mentorId}
              reviewCount={mentorInfo.reviewCount || 0}
              isOwner={isOwner}
              isLoggedIn={isLoggedIn}
              currentUserId={currentUserId}
              onMentorRefresh={refreshMentorStats}
            />
          )}
        </main>

        <aside className={styles.sidebar}>
          {!isOwner && !isAccessValid && (
            <SubscriptionSidebarCard
              plans={plans}
              selectedPlan={selectedPlan}
              selectedPlanIndex={selectedPlanIndex}
              currentPrice={currentPrice}
              subscribing={subscribing}
              onPrevPlan={showPrevPlan}
              onNextPlan={showNextPlan}
              onSelectPlan={setSelectedPlanIndex}
              onOpenSubscribeModal={() => setShowSubscribeModal(true)}
            />
          )}

          <MentorInfoCard mentorInfo={mentorInfo} isEditing={isEditing} editForm={editForm} onChange={handleInputChange} plans={plans} />

          <ScheduleCard mentorInfo={mentorInfo} isEditing={isEditing} editForm={editForm} onScheduleChange={handleScheduleChange} isAvailableNow={isAvailableNow} />
        </aside>
      </div>

      {showSubscribeModal && (
        <SubscribeModal
          currentPrice={currentPrice}
          canSubscribe={!!selectedPlan}
          subscribing={subscribing}
          onSubscribe={handleSubscribe}
          onClose={() => setShowSubscribeModal(false)}
        />
      )}

      {showCardModal && (
        <CardRegistrationModal
          phoneNumber={cardPhoneNumber}
          onPhoneNumberChange={setCardPhoneNumber}
          error={cardError}
          registering={registeringCard}
          onRegister={handleRegisterCardAndSubscribe}
          onClose={() => {
            setShowCardModal(false);
            setCardError("");
            setCardPhoneNumber("");
          }}
        />
      )}

      <ConfirmDialog
        isOpen={showCancelConfirm}
        title="구독 해지"
        message={`정말 구독을 해지하시겠습니까?\n해지해도 ${
          currentPeriodEnd ? new Date(currentPeriodEnd).toLocaleDateString() : "기간 만료일"
        }까지는 구독 혜택이 유지됩니다.`}
        confirmLabel="해지하기"
        danger
        submitting={cancelingSubscription}
        onConfirm={confirmCancelSubscription}
        onCancel={() => setShowCancelConfirm(false)}
      />
    </div>
  );
}
