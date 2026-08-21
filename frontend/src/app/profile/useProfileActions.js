"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import * as usersApi from "@/lib/users";
import { getToken } from "@/lib/users";
import { getMySubscriptions, unsubscribeMentor } from "@/lib/subscriptions";

export function useProfileActions() {
  const router = useRouter();
  const { user, isLoggedIn, loading, logout, refreshUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", interests: "" });
  const [hasAppliedMentor, setHasAppliedMentor] = useState(false);

  // 구독 목록 관련 state
  const [subscriptions, setSubscriptions] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(false);

  // 활동 통계(팔로워/팔로잉/작성 질문/작성 답변) — 공개 프로필 페이지(users/[id])와 동일한 API를 재사용한다.
  const [profileStats, setProfileStats] = useState({
    followerCount: 0,
    followingCount: 0,
    questionCount: 0,
    answerCount: 0,
  });
  const [loadingStats, setLoadingStats] = useState(false);

  // 💡 이메일 인증 모달 상태 관리 추가
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [verifyStep, setVerifyStep] = useState(1);
  const [verifyEmail, setVerifyEmail] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);

  const onChange = (field) => (e) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  // 내 구독 목록 조회
  const fetchSubscriptions = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
      setLoadingSubs(true);
      const data = await getMySubscriptions(token);
      setSubscriptions(Array.isArray(data) ? data : data?.content || []);
    } catch (err) {
      console.error("구독 목록 조회 실패:", err);
    } finally {
      setLoadingSubs(false);
    }
  }, []);

  // 내 활동 통계 로드 — 공개 프로필 페이지(users/[id]/page.jsx)가 쓰는 것과 같은 API 3개를 그대로 재사용한다.
  const fetchProfileStats = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoadingStats(true);
      const [profileData, questionsData, answeredData] = await Promise.all([
        usersApi.getPublicProfile(user.id),
        usersApi.getQuestionsByUser(user.id),
        usersApi.getAnsweredQuestionsByUser(user.id),
      ]);
      setProfileStats({
        followerCount: profileData?.followerCount || 0,
        followingCount: profileData?.followingCount || 0,
        // Page 응답의 totalElements(전체 개수)를 우선 쓰고, 없으면 현재 페이지 길이로 대체한다.
        questionCount: questionsData?.totalElements ?? questionsData?.content?.length ?? 0,
        answerCount: answeredData?.totalElements ?? answeredData?.content?.length ?? 0,
      });
    } catch (err) {
      console.error("활동 통계 조회 실패:", err);
    } finally {
      setLoadingStats(false);
    }
  }, [user]);

  // 유저 정보 → 폼 동기화 + 멘토 신청 상태 복원 + 구독 목록/활동 통계 로드
  useEffect(() => {
    if (!user) return;
    let ignore = false;

    setForm({
      name: user.name || "",
      email: user.email || "",
      interests: user.interests || "",
    });

    //이메일 인증 모달 기본값 세팅
    if (!verifyEmail) setVerifyEmail(user.email || "");

    (async () => {
      const token = getToken();
      if (!token) return;
      try {
        const app = await usersApi.getMyMentorApplication(token);
        if (!ignore) setHasAppliedMentor(app?.status === "PENDING");
      } catch {
        if (!ignore) setHasAppliedMentor(false);
      }
    })();

    fetchSubscriptions();
    fetchProfileStats();

    return () => {
      ignore = true;
    };
  }, [user, fetchSubscriptions, fetchProfileStats, verifyEmail]);

  // 💡 이메일 인증 기능 함수들 추가
  const closeEmailModal = () => {
    setShowEmailModal(false);
    setVerifyStep(1);
    setVerifyCode("");
  };

  const handleSendCode = async () => {
    if (!verifyEmail) return alert("이메일을 입력해주세요.");
    const token = getToken();
    setVerifyLoading(true);
    try {
      await usersApi.sendVerificationCode(verifyEmail, token);
      alert("인증번호가 메일로 발송되었습니다. (최대 1~2분 소요)");
      setVerifyStep(2);
    } catch (err) {
      alert(err.message || "인증번호 발송에 실패했습니다.");
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verifyCode) return alert("인증번호를 입력해주세요.");
    const token = getToken();
    setVerifyLoading(true);
    try {
      await usersApi.verifyEmailCode(verifyEmail, verifyCode, token);
      closeEmailModal();
      // 인증 성공 시 계정 이메일(=로그인 아이디)이 이 이메일로 바뀐다 — 다음부터는 이 이메일로
      // 로그인해야 하니, 헷갈리지 않게 바로 로그아웃시키고 안내한다.
      alert(`이메일 인증이 완료됐습니다.\n다음부터는 ${verifyEmail}(으)로 로그인해주세요.\n다시 로그인해주세요.`);
      logout();
      router.replace("/login");
    } catch (err) {
      alert(err.message || "인증번호가 올바르지 않거나 만료되었습니다.");
    } finally {
      setVerifyLoading(false);
    }
  };

  // 구독 해지 핸들러 (인자로 subscriptionId를 넘겨받도록 명시)
  const handleUnsubscribe = async (subscriptionId, mentorName) => {
    const token = getToken();
    if (!token) return;

    if (!subscriptionId) {
      alert("구독 정보 식별자(ID)를 찾을 수 없습니다.");
      return;
    }

    const confirmMsg = mentorName
        ? `'${mentorName}' 멘토 구독을 해지하시겠습니까?`
        : "정말 구독을 해지하시겠습니까?";

    if (!confirm(confirmMsg)) return;

    try {
      // lib/subscriptions 의 unsubscribeMentor 함수에 subscriptionId 전달
      await unsubscribeMentor(subscriptionId, token);
      alert("구독이 해지되었습니다.");
      fetchSubscriptions();
    } catch (err) {
      alert(err.message || "구독 해지에 실패했습니다.");
    }
  };

  const handleViewInfo = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const me = await usersApi.getMyProfile(token);
      alert(
          `📌 [최신 회원 정보]\n` +
          `• 이름: ${me.name}\n` +
          `• 이메일: ${me.email || "미등록"}\n` +
          `• 권한: ${me.role}\n` +
          `• 관심 분야: ${me.interests || "-"}`
      );
    } catch (err) {
      alert(err.message || "회원 정보를 조회하지 못했습니다.");
    }
  };

  const handleSaveProfile = async () => {
    const token = getToken();
    if (!token || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (form.name !== user.name || form.interests !== (user.interests || "")) {
        await usersApi.updateProfileInfo(form.name, form.interests, token);
      }
      if (form.email !== (user.email || "")) {
        await usersApi.updateProfileEmail(form.email, token);
      }
      await refreshUser();
      setIsEditing(false);
      alert("프로필이 수정되었습니다.");
    } catch (err) {
      alert(err.message || "프로필 수정에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelEdit = () => {
    setForm({
      name: user.name || "",
      email: user.email || "",
      interests: user.interests || "",
    });
    setIsEditing(false);
  };

  const handleApplyMentor = async () => {
    const token = getToken();
    if (!token) return;
    if (!confirm("전문가(MENTOR) 권한을 신청하시겠습니까?")) return;
    try {
      await usersApi.applyMentor(token);
      setHasAppliedMentor(true);
      alert("멘토 신청이 완료되었습니다. 관리자 승인을 기다려주세요.");
    } catch (err) {
      alert(err.message || "이미 신청되었거나 처리할 수 없는 상태입니다.");
    }
  };

  const handleDeleteAccount = async () => {
    const token = getToken();
    if (!token) return;
    if (!confirm("정말 탈퇴하시겠습니까? 계정 정보와 활동 내역은 복구되지 않습니다.")) return;
    try {
      await usersApi.deleteAccount(token);
      alert("회원 탈퇴가 완료되었습니다.");
      logout();
      router.replace("/");
    } catch (err) {
      alert(err.message || "회원 탈퇴 처리에 실패했습니다.");
    }
  };

  return {
    user,
    isLoggedIn,
    loading,
    isEditing,
    setIsEditing,
    cancelEdit,
    isSubmitting,
    form,
    onChange,
    hasAppliedMentor,
    profileStats,
    loadingStats,
    handleViewInfo,
    handleSaveProfile,
    handleApplyMentor,
    handleDeleteAccount,
    subscriptions,
    loadingSubs,
    handleUnsubscribe,
    fetchSubscriptions,
    // 💡 이메일 모달 관련 값들 리턴 추가
    showEmailModal,
    setShowEmailModal,
    verifyStep,
    setVerifyStep,
    verifyEmail,
    setVerifyEmail,
    verifyCode,
    setVerifyCode,
    verifyLoading,
    closeEmailModal,
    handleSendCode,
    handleVerifyCode,
  };
}