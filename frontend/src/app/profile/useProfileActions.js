"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import * as usersApi from "@/lib/users";
import { getToken } from "@/lib/users";
import { getMySubscriptions, unsubscribeMentor } from "@/lib/subscriptions";
import { uploadProfileImage, validateImage } from "@/lib/attachments";

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

  // 활동 통계(팔로워/팔로잉/작성 질문/작성 답변)
  const [profileStats, setProfileStats] = useState({
    followerCount: 0,
    followingCount: 0,
    questionCount: 0,
    answerCount: 0,
  });
  const [loadingStats, setLoadingStats] = useState(false);

  // 💡 멘토 신청 약관 팝업 관련 상태
  const [showMentorModal, setShowMentorModal] = useState(false);
  const [mentorTerms, setMentorTerms] = useState({
    privacy: false,
    fee: false,
  });

  // 💡 멘토 신청 완료(서류 제출 안내) 팝업 관련 상태
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // 이메일 인증 모달 상태 관리
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [verifyStep, setVerifyStep] = useState(1);
  const [verifyEmail, setVerifyEmail] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);

  // 비밀번호 변경 모달 상태
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  // 프로필 이미지 업로드 상태
  const [uploadingImage, setUploadingImage] = useState(false);

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

  // 내 활동 통계 로드
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

  // 이메일 인증 기능 함수들
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
      alert(`이메일 인증이 완료됐습니다.\n다음부터는 ${verifyEmail}(으)로 로그인해주세요.\n다시 로그인해주세요.`);
      logout();
      router.replace("/login");
    } catch (err) {
      alert(err.message || "인증번호가 올바르지 않거나 만료되었습니다.");
    } finally {
      setVerifyLoading(false);
    }
  };

  // 구독 해지 핸들러
  // 비밀번호 변경 모달
  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setCurrentPassword("");
    setNewPassword("");
    setNewPasswordConfirm("");
  };

  const handleChangePassword = async () => {
    if (!currentPassword) return alert("현재 비밀번호를 입력해주세요.");
    if (newPassword.length < 8) return alert("새 비밀번호는 8자 이상이어야 합니다.");
    if (newPassword !== newPasswordConfirm) return alert("새 비밀번호가 일치하지 않습니다.");

    const token = getToken();
    setPasswordSubmitting(true);
    try {
      await usersApi.updatePassword(currentPassword, newPassword, token);
      closePasswordModal();
      alert("비밀번호가 변경되었습니다.");
    } catch (err) {
      alert(err.message || "비밀번호 변경에 실패했습니다.");
    } finally {
      setPasswordSubmitting(false);
    }
  };

  // 프로필 이미지 변경 — 선택 즉시 업로드(별도 저장 버튼 없이 바로 반영)
  const handleProfileImageChange = async (file) => {
    if (!file) return;
    try {
      validateImage(file);
    } catch (err) {
      alert(err.message);
      return;
    }

    const token = getToken();
    setUploadingImage(true);
    try {
      const imageUrl = await uploadProfileImage(file);
      await usersApi.updateProfileImageUrl(imageUrl, token);
      await refreshUser();
      alert("프로필 이미지가 변경되었습니다.");
    } catch (err) {
      alert(err.message || "프로필 이미지 변경에 실패했습니다.");
    } finally {
      setUploadingImage(false);
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

  // 멘토 신청 버튼 클릭 -> 팝업 열기
  const handleApplyMentor = () => {
    const token = getToken();
    if (!token) return;
    setMentorTerms({ privacy: false, fee: false });
    setShowMentorModal(true);
  };

  // 약관 동의 후 실제 멘토 신청 전송
  const submitMentorApplication = async () => {
    const token = getToken();
    if (!token) return;

    if (!mentorTerms.privacy || !mentorTerms.fee) {
      alert("모든 필수 약관에 동의해주세요.");
      return;
    }

    try {
      await usersApi.applyMentor(token);
      setHasAppliedMentor(true);
      setShowMentorModal(false); // 약관 모달 닫기
      setShowSuccessModal(true); // 💡 서류 안내 팝업 띄우기 (alert 대체)
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
    showMentorModal,
    setShowMentorModal,
    mentorTerms,
    setMentorTerms,
    submitMentorApplication,
    showSuccessModal,
    setShowSuccessModal,
    showPasswordModal,
    setShowPasswordModal,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    newPasswordConfirm,
    setNewPasswordConfirm,
    passwordSubmitting,
    closePasswordModal,
    handleChangePassword,
    uploadingImage,
    handleProfileImageChange,
  };
}