"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import * as usersApi from "@/lib/users";
import { getToken } from "@/lib/users";

export function useProfileActions() {
  const router = useRouter();
  const { user, isLoggedIn, loading, logout, refreshUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", interests: "" });
  const [hasAppliedMentor, setHasAppliedMentor] = useState(false);
  const [mentorApps, setMentorApps] = useState([]);

  const onChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const fetchAdminData = useCallback(async () => {
    const token = getToken();
    if (user?.role !== "ADMIN" || !token) return;
    try {
      setMentorApps((await usersApi.getMentorApplications(token)) || []);
    } catch (err) {
      console.error("멘토 신청 목록 조회 실패:", err);
    }
  }, [user]);

  // 유저 정보 → 폼 동기화 + 멘토 신청 상태 복원
  useEffect(() => {
    if (!user) return;
    let ignore = false;

    setForm({
      name: user.name || "",
      email: user.email || "",
      interests: user.interests || "",
    });

    (async () => {
      const token = getToken();
      if (!token) return;
      try {
        const app = await usersApi.getMyMentorApplication(token);
        if (!ignore) setHasAppliedMentor(app?.status === "PENDING");
      } catch {
        if (!ignore) setHasAppliedMentor(false);
      }
      if (!ignore) fetchAdminData();
    })();

    return () => { ignore = true; };
  }, [user, fetchAdminData]);

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

  const handleApprove = async (targetId) => {
    try {
      await usersApi.approveMentor(targetId, getToken());
      await fetchAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReject = async (targetId) => {
    try {
      await usersApi.rejectMentor(targetId, getToken());
      await fetchAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  return {
    user, isLoggedIn, loading,
    isEditing, setIsEditing, cancelEdit,
    isSubmitting, form, onChange,
    hasAppliedMentor, mentorApps,
    handleViewInfo, handleSaveProfile, handleApplyMentor,
    handleDeleteAccount, handleApprove, handleReject,
  };
}