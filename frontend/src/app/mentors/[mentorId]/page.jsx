"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/contexts/AuthContext";
import styles from "./page.module.css";
import { requestIssueBillingKey } from "@portone/browser-sdk/v2";
import { uploadImage, validateImage, uploadFile, validateFile } from "@/lib/attachments";
import { getMentorPlans } from "@/lib/mentorPlans";
import { subscribeToMentor } from "@/lib/subscriptions";
import { prepareBillingKeyIssuance, registerPaymentMethod } from "@/lib/payments";
import { getOrCreateChatRoom } from "@/lib/chat";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const MAX_BIO_LENGTH = 500;
const DAYS_OF_WEEK = ["월", "화", "수", "목", "금", "토", "일"];

const parseScheduleMap = (scheduleStr = "") => {
  const scheduleMap = {};
  DAYS_OF_WEEK.forEach(day => {
    scheduleMap[day] = { enabled: false, startTime: "10:00", endTime: "17:00" };
  });

  if (!scheduleStr) return scheduleMap;

  const matches = [...scheduleStr.matchAll(/([월화수목금토일])\s*\(([^)]+)\)/g)];
  if (matches.length > 0) {
    matches.forEach(match => {
      const day = match[1];
      const timeRange = match[2];
      const [start = "10:00", end = "17:00"] = timeRange.split("-").map(t => t.trim());
      if (scheduleMap[day]) {
        scheduleMap[day] = { enabled: true, startTime: start, endTime: end };
      }
    });
  } else {
    const dayPart = scheduleStr.split("(")[0] || "";
    const timePart = scheduleStr.match(/\((.*?)\)/)?.[1] || "10:00 - 17:00";
    const [start = "10:00", end = "17:00"] = timePart.split("-").map(t => t.trim());
    
    DAYS_OF_WEEK.forEach(day => {
      if (dayPart.includes(day)) {
        scheduleMap[day] = { enabled: true, startTime: start, endTime: end };
      }
    });
  }
  return scheduleMap;
};

const stringifyScheduleMap = (scheduleMap) => {
  const parts = [];
  DAYS_OF_WEEK.forEach(day => {
    if (scheduleMap[day]?.enabled) {
      parts.push(`${day}(${scheduleMap[day].startTime} - ${scheduleMap[day].endTime})`);
    }
  });
  return parts.length > 0 ? parts.join(", ") : "상담 시간 미설정";
};

export default function MentorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const mentorId = params?.mentorId || params?.id;

  const { user: authUser, isLoggedIn } = useAuth();
  const currentUserId = authUser?.id || authUser?.userId;

  const [requestingConsult, setRequestingConsult] = useState(false);

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

  // 구독 요금제 캐러셀 + 결제 진행 상태
  const [plans, setPlans] = useState([]);
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);
  const [subscribing, setSubscribing] = useState(false);

  // 구독 유도 모달 상태 추가
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
  });

  const [isWritingPost, setIsWritingPost] = useState(false);
  const [postForm, setPostForm] = useState({
    title: "",
    content: "",
    category: "일반",
    isPublic: true,
  });

  const [files, setFiles] = useState([]);
  const [docFiles, setDocFiles] = useState([]); // 게시글 첨부 문서(PDF/ZIP)
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const contentRef = useRef(null);

  const checkIsAvailable = (scheduleStr) => {
    if (!scheduleStr) return false;
    const now = new Date();
    const day = now.getDay();
    const daysMap = ["일", "월", "화", "수", "목", "금", "토"];
    const todayStr = daysMap[day];

    const scheduleMap = parseScheduleMap(scheduleStr);
    const todayInfo = scheduleMap[todayStr];

    if (!todayInfo || !todayInfo.enabled) return false;

    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = todayInfo.startTime.split(":").map(Number);
    const [endH, endM] = todayInfo.endTime.split(":").map(Number);
    
    return currentTime >= (startH * 60 + startM) && currentTime <= (endH * 60 + endM);
  };

  const insertCodeBlock = () => {
    const el = contentRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = postForm.content.slice(start, end);
    const snippet = "```java\n" + (selected || "여기에 코드") + "\n```\n";

    setPostForm((prev) => ({
      ...prev,
      content: prev.content.slice(0, start) + snippet + prev.content.slice(end),
    }));

    requestAnimationFrame(() => {
      el.focus();
      const pos = start + "```java\n".length;
      el.setSelectionRange(pos, pos + (selected ? selected.length : 6));
    });
  };

  const handleFileChange = (event) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = "";
    try {
      selected.forEach(validateImage);
      setFiles((prev) => [...prev, ...selected]);
      setErrorMessage("");
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDocFileChange = (event) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = "";
    try {
      selected.forEach(validateFile);
      setDocFiles((prev) => [...prev, ...selected]);
      setErrorMessage("");
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  const removeDocFile = (index) => {
    setDocFiles((prev) => prev.filter((_, i) => i !== index));
  };

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

  useEffect(() => {
    if (!mentorId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") || localStorage.getItem("token") : null;
        const headers = {
          "Content-Type": "application/json",
          ...(currentUserId && { "X-USER-ID": String(currentUserId) }),
          ...(token && { Authorization: `Bearer ${token}` }),
        };

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
                const isValidActive = subStatus === 'ACTIVE';
                const isCancelReservedButValid = subStatus === 'CANCEL_RESERVED' && (!endDate || endDate > now);
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

  // 구독하기: 등록된 카드(빌링키)로 서버가 즉시 청구하고 결과까지 한 번에 받는다 — 결제창 팝업 없음.
  // 등록된 카드가 없으면 서버가 PAYMENT_METHOD_REQUIRED로 거절 → 별도 페이지로 보내지 않고
  // 이 자리에서 바로 카드 등록 모달(showCardModal)을 띄운다(handleRegisterCardAndSubscribe).
  const handleSubscribe = async () => {
    if (!isLoggedIn) {
      alert("로그인이 필요한 서비스입니다.");
      return;
    }
    if (!selectedPlan) {
      alert("구독할 요금제를 선택해주세요.");
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

        // 구독 성공 시 구독자 수 +1 실시간 반영
        setMentorInfo((prev) => ({
          ...prev,
          subscriberCount: (prev.subscriberCount || 0) + 1,
        }));

        setShowSubscribeModal(false);
        alert("멘토 구독이 완료되었습니다!");
      } else {
        alert("결제 검증에 실패했습니다. 잠시 후 다시 시도해주세요.");
      }
    } catch (e) {
      console.error(e);
      // ⚠️ 백엔드 ErrorResponse 필드명은 errorCode가 아니라 code다 (GlobalExceptionHandler 확인).
      if (e.data?.code === "PAYMENT_METHOD_REQUIRED") {
        setCardError("");
        setShowCardModal(true);
        return;
      }
      alert(e.message || "구독 결제 중 오류가 발생했습니다.");
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

  const handleCancelSubscription = async () => {
    if (subscriptionStatus === 'CANCEL_RESERVED') {
      const endDateStr = currentPeriodEnd ? new Date(currentPeriodEnd).toLocaleDateString() : "기간 만료일";
      alert(`이미 해지 예약된 구독입니다.\n${endDateStr}까지는 정상적으로 혜택을 이용하실 수 있습니다.`);
      return;
    }

    if (!subscriptionId) {
      alert("구독 정보를 찾을 수 없습니다.");
      return;
    }
    
    const endDateStr = currentPeriodEnd ? new Date(currentPeriodEnd).toLocaleDateString() : "기간 만료일";
    if (!confirm(`정말 구독을 해지하시겠습니까?\n해지해도 ${endDateStr}까지는 구독 혜택이 유지됩니다.`)) return;

    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
      const res = await fetch(`${BACKEND_URL}/api/v1/subscriptions/${subscriptionId}/cancel`, {
        method: "PATCH",
        headers: {
          "X-USER-ID": String(currentUserId),
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (res.ok) {
        setSubscriptionStatus('CANCEL_RESERVED');
        alert(`구독이 해지 예약되었습니다. ${endDateStr}까지 혜택이 유지됩니다.`);
      } else {
        alert("구독 해지에 실패했습니다.");
      }
    } catch (e) {
      console.error(e);
      alert("서버 오류가 발생했습니다.");
    }
  };

  const handleConsultRequest = async () => {
    if (!isLoggedIn) {
      alert("로그인이 필요한 서비스입니다.");
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
      alert(err.message || "채팅방을 시작하지 못했습니다.");
    } finally {
      setRequestingConsult(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePostInputChange = (e) => {
    const { name, value } = e.target;
    setPostForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    if (!editForm.bio.trim()) {
      alert("소개글을 입력해주세요.");
      return;
    }
    if (editForm.bio.length > MAX_BIO_LENGTH) {
      alert(`소개글은 ${MAX_BIO_LENGTH}자 이내로 작성해주세요.`);
      return;
    }

    const normalizedForm = {
      ...editForm,
      bio: editForm.bio.trim(),
      company: editForm.company.trim(),
      career: editForm.career.trim(),
      tags: editForm.tags.split(",").map((tag) => tag.trim()).filter(Boolean).join(", "),
      education: editForm.education.trim(),
      schedule: editForm.schedule.trim(),
    };

    try {
      setSavingProfile(true);
      const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
      const res = await fetch(`${BACKEND_URL}/api/mentors/${mentorId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(currentUserId && { "X-USER-ID": String(currentUserId) }),
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(normalizedForm),
      });

      if (res.ok) {
        const updatedData = await res.json().catch(() => ({}));
        setMentorInfo({ ...mentorInfo, ...updatedData, ...normalizedForm });
        setEditForm(normalizedForm);
        setProfileSnapshot(null);
        setIsEditing(false);
        alert("프로필이 성공적으로 수정되었습니다.");
      } else {
        const error = await res.json().catch(() => ({}));
        alert(error.message || "프로필 수정에 실패했습니다.");
      }
    } catch (error) {
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

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!postForm.title || !postForm.content) {
      alert("제목과 내용을 모두 입력해주세요.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
      const uploaded = files.length > 0 ? await Promise.all(files.map((f) => uploadImage(f))) : [];
      const uploadedDocs = docFiles.length > 0 ? await Promise.all(docFiles.map((f) => uploadFile(f))) : [];
      const attachmentIds = [...uploaded, ...uploadedDocs].map((u) => u.attachId);

      const res = await fetch(`${BACKEND_URL}/api/v1/mentors/${mentorId}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-USER-ID": currentUserId,
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ ...postForm, attachmentIds }),
      });

      if (res.ok) {
        alert("게시글이 작성되었습니다.");
        const newPostData = await res.json().catch(() => null);
        if (newPostData && newPostData.id) {
          setArticles((prev) => [newPostData, ...prev]);
        } else {
          setTimeout(async () => { await fetchArticles(); }, 200);
        }
        setPostForm({ title: "", content: "", category: "일반", isPublic: true });
        setFiles([]);
        setDocFiles([]);
        setIsWritingPost(false);
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMessage(err.message || "요청 실패");
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("서버 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className={styles.loading}>로딩 중...</div>;
  if (!mentorInfo) return <div className={styles.error}>멘토 정보를 찾을 수 없습니다.</div>;

  const tagsArray = mentorInfo.tags ? mentorInfo.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
  const isAccessValid = isSubscribed || (subscriptionStatus === 'CANCEL_RESERVED' && (!currentPeriodEnd || new Date(currentPeriodEnd) > new Date()));
  const currentPrice = selectedPlan ? Number(selectedPlan.price).toLocaleString() : "-";
 const isAvailableNow = checkIsAvailable(mentorInfo.schedule);
  const statusColor = isAvailableNow ? "#22c55e" : "#94a3b8";

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
      {/* 프로필 섹션 */}
      <section className={styles.profileBanner}>
        <div className={styles.heroLeft}>
          <div className={styles.avatarWrapper}>
            <img src={mentorInfo.profileImageUrl || "/images/default-profile.png"} alt={mentorInfo.name || "멘토"} className={styles.avatar} />
            <span className={styles.onlineDot} style={{ backgroundColor: statusColor, borderColor: "#fff" }} />
          </div>
          <div className={styles.heroText}>
            <h1 className={styles.mentorName}>{mentorInfo.name}</h1>
            {isEditing ? (
              <div className={styles.editWrapper}>
                <textarea name="bio" value={editForm.bio} onChange={handleInputChange} maxLength={MAX_BIO_LENGTH} className={styles.editBioInput} />
                <p className={styles.charCount}>{editForm.bio.length} / {MAX_BIO_LENGTH}자</p>
              </div>
            ) : (
              <p className={styles.mentorBio}>{mentorInfo.bio || "소개글이 없습니다."}</p>
            )}
            <div className={styles.tagGroup}>
              {tagsArray.slice(0, 5).map((tag, i) => (<span key={i} className={styles.tag}>{tag}</span>))}
            </div>
            <div className={styles.statsRow}>
              <span><span className={styles.star}>★</span> {mentorInfo.rating || "4.9"} ({mentorInfo.reviewCount || 0})</span>
              <span>♙ {mentorInfo.subscriberCount || 0} 구독자</span>
            </div>
          </div>
        </div>

        <div className={styles.heroRight}>
          <div className={styles.heroStats}>
            <div className={styles.statBox}>
              <span className={styles.statIcon}>▤</span>
              <span className={styles.statLabel}>게시글</span>
              <span className={styles.statValue}>{articles.length}</span>
              <span className={styles.statSub}>전체 게시글</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statIcon}>♡</span>
              <span className={styles.statLabel}>리뷰</span>
              <span className={styles.statValue}>{mentorInfo.reviewCount || 0}</span>
              <span className={styles.statSub}>평균 리뷰</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statIcon}>◷</span>
              <span className={styles.statLabel}>상담 가능</span>
              <span className={styles.statValueSmall}>
                {(() => {
                  const scheduleMap = parseScheduleMap(mentorInfo.schedule);
                  const activeDays = DAYS_OF_WEEK.filter(d => scheduleMap[d]?.enabled);
                  return activeDays.length > 0 ? activeDays.join(", ") : "미설정";
                })()}
              </span>
              <span className={styles.statSub}>요일별 운영</span>
            </div>
          </div>

          <div className={styles.actionBtns}>
            {isOwner ? (
              isEditing ? (
                <>
                  <button className={styles.saveBtn} onClick={handleSaveProfile} disabled={savingProfile}>
                    {savingProfile ? "저장 중..." : "저장"}
                  </button>
                  <button className={styles.cancelBtn} onClick={cancelProfileEdit}>취소</button>
                </>
              ) : (
                <button className={styles.editBtn} onClick={startProfileEdit}>프로필 수정</button>
              )
            ) : (
              <>
                {isSubscribed ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
                    <button className={styles.subBtn} onClick={handleCancelSubscription} style={{ background: subscriptionStatus === 'CANCEL_RESERVED' ? '#f97316' : '#1261f5' }}>
                      {subscriptionStatus === 'CANCEL_RESERVED' ? '✓ 해지 예약됨' : '✓ 구독중'}
                    </button>
                    {subscriptionStatus === 'CANCEL_RESERVED' && currentPeriodEnd && (
                      <span style={{ fontSize: '9px', color: '#64748b', textAlign: 'center' }}>
                        (~{new Date(currentPeriodEnd).toLocaleDateString()}까지)
                      </span>
                    )}
                  </div>
                ) : (
                  <button className={styles.subBtn} onClick={() => setShowSubscribeModal(true)}>구독하기</button>
                )}
                <button className={styles.consultBtn} onClick={handleConsultRequest} disabled={requestingConsult}>
                  {requestingConsult ? "연결 중..." : "상담 신청"}
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 탭 내비게이션 */}
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
                  <button className={styles.editBtn} onClick={() => { setPostForm({ title: "", content: "", category: "일반", isPublic: true }); setFiles([]); setDocFiles([]); setIsWritingPost(!isWritingPost); }}>
                    {isWritingPost ? "작성 취소" : "✏️ 새 게시글 작성"}
                  </button>
                </div>
              )}

              {isWritingPost && (
                <form onSubmit={handlePostSubmit} className={styles.postForm}>
                  <h3>새 게시글 작성</h3>
                  <div className={styles.formGroup}>
                    <label className={styles.fileLabel}>카테고리</label>
                    <select name="category" value={postForm.category} onChange={handlePostInputChange} className={styles.formInput}>
                      <option value="일반">일반</option>
                      <option value="실무팁">실무팁</option>
                      <option value="커리어">커리어</option>
                      <option value="질문답변">질문답변</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.fileLabel}>공개 범위</label>
                    <div style={{ display: "flex", gap: "15px", marginTop: "5px" }}>
                      <label style={{ fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
                        <input type="radio" name="isPublic" checked={postForm.isPublic === true} onChange={() => setPostForm(prev => ({ ...prev, isPublic: true }))} />
                        전체 공개 (비구독자 열람 가능)
                      </label>
                      <label style={{ fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
                        <input type="radio" name="isPublic" checked={postForm.isPublic === false} onChange={() => setPostForm(prev => ({ ...prev, isPublic: false }))} />
                        구독자 전용
                      </label>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <input type="text" name="title" placeholder="제목을 입력하세요" value={postForm.title} onChange={handlePostInputChange} className={styles.formInput} required />
                  </div>

                  <div className={styles.formGroup}>
                    <div className={styles.formLabelRow}>
                      <label htmlFor="content">내용 (마크다운)</label>
                      <button type="button" onClick={insertCodeBlock} className={styles.codeButton}>&lt;/&gt; 코드블록</button>
                    </div>
                    <textarea id="content" ref={contentRef} name="content" placeholder="내용을 입력하세요" value={postForm.content} onChange={handlePostInputChange} rows={6} className={styles.formTextarea} required />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.fileLabel}>파일 첨부 <span>이미지, 최대 5MB</span></label>
                    <input id="images" type="file" accept="image/png,image/jpeg,image/gif,image/webp" multiple onChange={handleFileChange} disabled={submitting} />
                    {files.length > 0 && (
                      <ul className={styles.filePreviewList}>
                        {files.map((file, index) => (
                          <li key={index} className={styles.filePreview}>
                            <img src={URL.createObjectURL(file)} alt={file.name} />
                            <button type="button" onClick={() => removeFile(index)}>×</button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.fileLabel}>문서 첨부 <span>PDF, ZIP, 최대 50MB</span></label>
                    <input id="docs" type="file" accept=".pdf,.zip,application/pdf,application/zip" multiple onChange={handleDocFileChange} disabled={submitting} />
                    {docFiles.length > 0 && (
                      <ul style={{ listStyle: "none", padding: 0, marginTop: 8, display: "grid", gap: 6 }}>
                        {docFiles.map((file, index) => (
                          <li key={index} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid #e5e7eb", borderRadius: 6, padding: "6px 10px", fontSize: 13 }}>
                            <span>📎 {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)</span>
                            <button type="button" onClick={() => removeDocFile(index)}>×</button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {errorMessage && <p className={styles.formError}>{errorMessage}</p>}
                  <button type="submit" className={styles.saveBtn} disabled={submitting}>{submitting ? "처리 중..." : "작성 완료"}</button>
                </form>
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

              {/* 게시글 목록 영역 */}
              <div className={styles.articleArea}>
                <div className={styles.articleList}>
                  {filteredArticles.length === 0 ? (
                    <div className={styles.empty}>등록된 게시글이 없습니다.</div>
                  ) : (
                    filteredArticles.map((article, index) => {
                      const isPostAccessible = isOwner || article.isPublic !== false || isAccessValid;

                      const likeCount = article.likeCount ?? 128 - index * 8;
                      const commentCount = article.commentCount ?? Math.max(0, 23 - index);
                      const viewCount = article.viewCount ?? (index === 0 ? "1.2K" : index === 1 ? "892" : index === 2 ? "1.1K" : "731");

                      return (
                        <div key={article.id} className={styles.articleCardWrapper}>
                          {isPostAccessible ? (
                            <Link className={styles.articleCard} href={`/mentors/${mentorId}/posts/${article.id}`}>                              
                              <div className={styles.articleBody}>
                                <div className={styles.articleTop}>
                                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <span className={styles.articleCategory}>{article.category || "일반"}</span>
                                    <span style={{ fontSize: '11px', fontWeight: '600', color: article.isPublic !== false ? '#16a34a' : '#f97316' }}>
                                      {article.isPublic !== false ? "전체공개" : "🔒 구독자전용"}
                                    </span>
                                  </div>
                                  <span className={styles.date}>{article.createdAt ? article.createdAt.replace("T", " ").substring(0, 10) : ""}</span>
                                </div>
                                <h3 className={styles.articleTitle}>{article.title}</h3>
                                <div className={styles.articleBottom}>
                                  <div className={styles.articleStats}>
                                    <span>♡ {likeCount}</span>
                                    <span>💬 {commentCount}</span>
                                    <span>◉ {viewCount}</span>
                                    <span className={styles.bookmark}>♡</span>
                                  </div>
                                </div>
                              </div>
                            </Link>
                          ) : (
                            <div className={styles.articleCardLocked} onClick={() => setShowSubscribeModal(true)}>
                              <div className={styles.lockNoticeInner}>
                                <span style={{ fontSize: '20px' }}>🔒</span>
                                <div>
                                  <span className={styles.articleCategory}>{article.category || "일반"}</span>
                                  <h4 style={{ margin: '4px 0 2px', fontSize: '14px', color: '#111827' }}>{article.title}</h4>
                                  <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>구독자 전용 게시글입니다. 클릭하여 구독 후 확인해보세요!</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === "info" && (
            <div className={styles.empty}>
              <h3>멘토 소개</h3>
              <p style={{ marginTop: '10px' }}>{mentorInfo.bio || '상세 소개 내용이 없습니다.'}</p>
            </div>
          )}

          {activeTab === "review" && (
            <div className={styles.empty}>
              <h3>리뷰 ({mentorInfo.reviewCount || 0})</h3>
              <p style={{ marginTop: '10px' }}>등록된 리뷰가 없습니다.</p>
            </div>
          )}
        </main>

        {/* 사이드바 */}
        <aside className={styles.sidebar}>
          {!isOwner && !isAccessValid && (
            <div className={styles.sidebarCard}>
              <div className={styles.sidebarTitleRow}>
                <h3>구독 혜택</h3>
                {selectedPlan && <span className={styles.sidebarPrice}>월 {currentPrice}원</span>}
              </div>

              {plans.length === 0 ? (
                <p style={{ fontSize: 12, color: "#7b8799", margin: "0 0 15px" }}>
                  아직 등록된 요금제가 없습니다.
                </p>
              ) : (
                <>
                  <div className={styles.planSwitcher}>
                    <button
                      type="button"
                      className={styles.planArrow}
                      onClick={showPrevPlan}
                      disabled={plans.length <= 1}
                      aria-label="이전 요금제"
                    >
                      ‹
                    </button>
                    <div className={styles.planCard}>
                      <strong className={styles.planName}>{selectedPlan.planName}</strong>
                      <p className={styles.planDescription}>
                        {selectedPlan.description || "설명이 등록되지 않았습니다."}
                      </p>
                      <span className={styles.planCycle}>{selectedPlan.billingCycle}개월마다 결제</span>
                    </div>
                    <button
                      type="button"
                      className={styles.planArrow}
                      onClick={showNextPlan}
                      disabled={plans.length <= 1}
                      aria-label="다음 요금제"
                    >
                      ›
                    </button>
                  </div>

                  {plans.length > 1 && (
                    <div className={styles.planDots}>
                      {plans.map((p, i) => (
                        <button
                          type="button"
                          key={p.id}
                          className={`${styles.planDot} ${i === selectedPlanIndex ? styles.planDotActive : ""}`}
                          onClick={() => setSelectedPlanIndex(i)}
                          aria-label={`${p.planName} 선택`}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

              <ul className={styles.benefitList}>
                <li><span>✓</span><div><strong>전체 피드 열람</strong><small>모든 게시글 무제한 열람</small></div></li>
                <li><span>✓</span><div><strong>구독자 전용 콘텐츠</strong><small>실무 노하우와 심층 인사이트</small></div></li>
                <li><span>✓</span><div><strong>자료 다운로드</strong><small>템플릿, 체크리스트, 가이드 제공</small></div></li>
                <li><span>✓</span><div><strong>댓글 참여 및 질문</strong><small>멘토에게 직접 질문하고 답변 받기</small></div></li>
              </ul>
              <button
                className={styles.sidebarSubscribeBtn}
                onClick={() => setShowSubscribeModal(true)}
                disabled={!selectedPlan || subscribing}
              >
                {subscribing ? "결제 진행 중..." : "구독하고 전체 보기"}
              </button>
            </div>
          )}

          <div className={styles.sidebarCard}>
            <h3>멘토 정보</h3>
            <ul className={styles.infoList}>
              <li>
                <strong>현직</strong>
                {isEditing ? <input type="text" name="company" value={editForm.company} onChange={handleInputChange} className={styles.editInput} /> : <span>{mentorInfo.company || "Senior UI/UX Designer @ 네이버"}</span>}
              </li>
              <li>
                <strong>경력</strong>
                {isEditing ? <input type="text" name="career" value={editForm.career} onChange={handleInputChange} className={styles.editInput} /> : <span>{mentorInfo.career || "9년"}</span>}
              </li>
              <li>
                <strong>전문 분야</strong>
                {isEditing ? <input type="text" name="tags" value={editForm.tags} onChange={handleInputChange} className={styles.editInput} placeholder="쉼표(,)로 구분" /> : <span>{mentorInfo.tags || "UI/UX, 프로토타이핑"}</span>}
              </li>
              <li>
                <strong>학력</strong>
                {isEditing ? <input type="text" name="education" value={editForm.education} onChange={handleInputChange} className={styles.editInput} /> : <span>{mentorInfo.education || "홍익대학교 디자인과"}</span>}
              </li>
              {isEditing && (
                <li>
                  <strong>구독 요금제</strong>
                  {plans.length === 0 ? (
                    <span style={{ fontSize: 11, color: "#7b8799" }}>등록된 요금제가 없습니다.</span>
                  ) : (
                    <span style={{ fontSize: 11, color: "#526074" }}>
                      {plans.map((p) => `${p.planName} 월 ${Number(p.price).toLocaleString()}원`).join(", ")}
                    </span>
                  )}
                  <a href="/profile" style={{ display: "block", marginTop: 4, fontSize: 10, color: "#1261f5" }}>
                    요금제 등록·수정은 내 프로필 &gt; 구독 플랜 관리에서 →
                  </a>
                </li>
              )}
            </ul>
          </div>

          <div className={styles.sidebarCard}>
            <div className={styles.scheduleHeader}>
              <h3>상담 가능 시간</h3>
              <span className={styles.available} style={{ color: statusColor }}>
                ● 오늘 기준 {isAvailableNow ? '상담 가능' : '상담 불가'}
              </span>
            </div>

            {isEditing ? (
              <div className={styles.scheduleEditContainer}>
                <label className={styles.editSubLabel}>요일 및 시간 개별 설정</label>
                <div className={styles.dayPillGroup}>
                  {DAYS_OF_WEEK.map((day) => {
                    const scheduleMap = parseScheduleMap(editForm.schedule);
                    const isSelected = scheduleMap[day]?.enabled;
                    return (
                      <button
                        key={day}
                        type="button"
                        className={`${styles.dayPill} ${isSelected ? styles.dayPillActive : ""}`}
                        onClick={() => {
                          const nextMap = { ...scheduleMap };
                          nextMap[day] = { ...nextMap[day], enabled: !isSelected };
                          setEditForm(prev => ({ ...prev, schedule: stringifyScheduleMap(nextMap) }));
                        }}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>

                <div className={styles.dayTimeConfigList}>
                  {DAYS_OF_WEEK.map((day) => {
                    const scheduleMap = parseScheduleMap(editForm.schedule);
                    if (!scheduleMap[day]?.enabled) return null;
                    return (
                      <div key={day} className={styles.dayTimeRow}>
                        <span className={styles.dayBadge}>{day}요일</span>
                        <div className={styles.timeInputWrapper}>
                          <input
                            type="time"
                            value={scheduleMap[day].startTime}
                            onChange={(e) => {
                              const nextMap = { ...scheduleMap };
                              nextMap[day].startTime = e.target.value;
                              setEditForm(prev => ({ ...prev, schedule: stringifyScheduleMap(nextMap) }));
                            }}
                            className={styles.roundedTimeInput}
                          />
                          <span className={styles.timeWave}>~</span>
                          <input
                            type="time"
                            value={scheduleMap[day].endTime}
                            onChange={(e) => {
                              const nextMap = { ...scheduleMap };
                              nextMap[day].endTime = e.target.value;
                              setEditForm(prev => ({ ...prev, schedule: stringifyScheduleMap(nextMap) }));
                            }}
                            className={styles.roundedTimeInput}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className={styles.scheduleViewBox}>
                {(() => {
                  const scheduleMap = parseScheduleMap(mentorInfo.schedule);
                  const activeDays = DAYS_OF_WEEK.filter(day => scheduleMap[day]?.enabled);
                  if (activeDays.length === 0) {
                    return <div className={styles.scheduleText}>{mentorInfo.schedule || "등록된 상담 가능 시간이 없습니다."}</div>;
                  }
                  return (
                    <div className={styles.scheduleList}>
                      {activeDays.map((day) => (
                        <div key={day} className={styles.scheduleRowItem}>
                          <span className={styles.scheduleDay}>{day}요일</span>
                          <span className={styles.scheduleTime}>{scheduleMap[day].startTime} ~ {scheduleMap[day].endTime}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
            <p className={styles.scheduleNotice}>* 예약은 상담 신청 버튼을 통해 가능합니다.</p>
          </div>
        </aside>
      </div>

      {/* 구독 유도 모달 팝업 */}
      {showSubscribeModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <span className={styles.modalLockIcon}>🔒</span>
            <h2>구독자 전용 콘텐츠입니다</h2>
            <p>이 멘토의 모든 실무 노하우와 전체 게시글을 확인하려면 구독을 시작해보세요!</p>
            
            <div className={styles.modalPriceBox}>
              <span>구독 이용료</span>
              <strong>월 {currentPrice}원</strong>
            </div>

            <p style={{ fontSize: 12, color: "#6b7280", margin: "12px 0 0" }}>
              등록된 카드로 바로 결제됩니다. 카드가 없으면 이 자리에서 바로 등록하실 수 있어요.
            </p>

            <div className={styles.modalActionBtns}>
              <button className={styles.modalSubBtn} onClick={handleSubscribe} disabled={!selectedPlan || subscribing}>
                {subscribing ? "결제 진행 중..." : `월 ${currentPrice}원으로 구독하기`}
              </button>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setShowSubscribeModal(false)}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 카드 미등록 상태에서 구독 시도 → 별도 페이지 이동 없이 이 자리에서 바로 카드 등록 */}
      {showCardModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <span className={styles.modalLockIcon}>💳</span>
            <h2>결제할 카드가 없어요</h2>
            <p>구독하려면 카드를 먼저 등록해야 해요. 지금 등록하면 바로 이어서 구독이 진행됩니다.</p>

            <div style={{ textAlign: "left", marginTop: 16 }}>
              <label style={{ display: "block", fontSize: 13, color: "#374151", marginBottom: 6 }}>
                휴대폰 번호
              </label>
              <input
                type="text"
                value={cardPhoneNumber}
                onChange={(e) => setCardPhoneNumber(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                maxLength={11}
                placeholder="01012345678"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  fontSize: 14,
                  boxSizing: "border-box",
                }}
              />
              <p style={{ fontSize: 12, color: "#9ca3af", margin: "6px 0 0" }}>
                등록 버튼을 누르면 PortOne 결제창이 열리고, 거기서 카드 정보를 직접 입력합니다. 카드번호는 저희 서버에 저장되지 않습니다.
              </p>
            </div>

            {cardError && (
              <p style={{ color: "crimson", fontSize: 13, marginTop: 8 }}>{cardError}</p>
            )}

            <div className={styles.modalActionBtns} style={{ marginTop: 16 }}>
              <button
                className={styles.modalSubBtn}
                onClick={handleRegisterCardAndSubscribe}
                disabled={registeringCard}
              >
                {registeringCard ? "카드 등록 중..." : "카드 등록하고 구독하기"}
              </button>
              <button
                className={styles.modalCloseBtn}
                onClick={() => {
                  setShowCardModal(false);
                  setCardError("");
                  setCardPhoneNumber("");
                }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
