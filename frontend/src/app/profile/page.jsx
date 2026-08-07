"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FaUserLarge } from "react-icons/fa6";
import { useAuth } from "@/app/contexts/AuthContext";
import styles from "./page.module.css";
import * as usersApi from "@/lib/users";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoggedIn, loading, logout } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [mentorStatus, setMentorStatus] = useState(user?.mentorStatus || "NONE");

  const [mentorApps, setMentorApps] = useState([]);

  const getToken = () => localStorage.getItem("accessToken");

  const fetchAdminData = useCallback(async () => {
    const token = getToken();
    if (user?.role === "ADMIN" && token) {
      try {
        const apps = await usersApi.getMentorApplications(token);
        setMentorApps(apps || []);
      } catch (err) {
        console.error("멘토 신청 목록 조회 실패:", err);
      }
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setNewName(user.name || "");
      setNewEmail(user.email || "");
      if (user.mentorStatus) {
        setMentorStatus(user.mentorStatus);
      }
      fetchAdminData();
    }
  }, [user, fetchAdminData]);

  if (loading) return <main className={styles.page} />;
  if (!isLoggedIn || !user) {
    return (
      <main className={styles.page}>
        <p style={{ textAlign: "center", padding: "40px" }}>
          로그인이 필요합니다.
        </p>
      </main>
    );
  }

  const handleSaveProfile = async () => {
    const token = getToken();
    if (!token || isSubmitting) return;

    try {
      setIsSubmitting(true);
      if (newName !== user.name) {
        await usersApi.updateProfileName(newName, token);
      }
      if (newEmail !== user.email) {
        await usersApi.updateProfileEmail(newEmail, token);
      }
      alert("프로필이 성공적으로 수정되었습니다. 다시 로그인해주세요.");
      setIsEditing(false);
      logout();
      router.push("/login");
    } catch (err) {
      alert(err.message || "프로필 수정에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyMentor = async () => {
    const token = getToken();
    if (!token) return;

    if (confirm("전문가(MENTOR) 권한을 신청하시겠습니까?")) {
      try {
        await usersApi.applyMentor(token);
        alert("멘토 신청이 완료되었습니다. 관리자의 승인을 기다려주세요.");
        setMentorStatus("PENDING");
      } catch (err) {
        alert(err.message || "이미 신청되었거나 처리할 수 없는 상태입니다.");
      }
    }
  };

  const handleCancelMentor = async () => {
    const token = getToken();
    if (!token) return;

    if (confirm("멘토 신청을 취소하시겠습니까?")) {
      try {
        if (typeof usersApi.cancelMentorApplication === "function") {
          await usersApi.cancelMentorApplication(token);
        }
        alert("멘토 신청이 취소되었습니다.");
        setMentorStatus("NONE");
      } catch (err) {
        alert(err.message || "신청 취소 처리에 실패했습니다.");
      }
    }
  };

  const handleDeleteAccount = async () => {
    const token = getToken();
    if (!token) return;

    if (confirm("정말 탈퇴하시겠습니까? 계정 정보와 활동 내역은 복구되지 않습니다.")) {
      try {
        await usersApi.deleteAccount(token);
        alert("회원 탈퇴가 완료되었습니다.");
        logout();
        router.replace("/");
      } catch (err) {
        alert(err.message || "회원 탈퇴 처리에 실패했습니다.");
      }
    }
  };

  const handleApprove = async (targetId) => {
    const token = getToken();
    try {
      await usersApi.approveMentor(targetId, token);
      alert("승인 처리되었습니다.");
      fetchAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReject = async (targetId) => {
    const token = getToken();
    try {
      await usersApi.rejectMentor(targetId, token);
      alert("거절 처리되었습니다.");
      fetchAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case "MENTOR":
        return "현직 전문가 ";
      case "ADMIN":
        return "시스템 관리자 ";
      case "USER":
      default:
        return "취업 준비생 ";
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.contentGrid}>
        <section className={styles.profileCard}>
          <div className={styles.cardHeading}>
            <h1>내 프로필 (마이페이지)</h1>
            <span className={styles.privateText}>🔒 개인 정보는 본인만 확인할 수 있습니다</span>
          </div>

          <div className={styles.profileSummary}>
            <div className={styles.avatar} aria-hidden="true">
              <FaUserLarge />
            </div>
            <div className={styles.profileIdentity}>
              {isEditing ? (
                <input
                  type="text"
                  className={styles.nameInput}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="이름"
                />
              ) : (
                <h2>{user.name}</h2>
              )}
              <div className={styles.roleLine}>
                <span>{getRoleLabel(user.role)}</span>
                <span className={styles.roleBadge}>{user.role}</span>
              </div>
            </div>
          </div>

          <div className={styles.divider} />

          <dl className={styles.profileDetails}>
            <div>
              <dt>이메일 주소</dt>
              <dd>
                {isEditing ? (
                  <input
                    type="email"
                    className={styles.inlineInput}
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                ) : (
                  user.email
                )}
              </dd>
            </div>
            <div>
              <dt>가입 일시</dt>
              <dd>2026.01.10 14:32</dd>
            </div>
            <div>
              <dt>관심 분야</dt>
              <dd>백엔드, 멘토링</dd>
            </div>
          </dl>

          {user.role === "USER" && (
            <div className={styles.mentorBanner}>
              <div className={styles.mentorBannerIcon}>📋</div>
              <div className={styles.mentorBannerContent}>
                <div className={styles.mentorBannerTitle}>
                  <strong>멘토 신청</strong>
                  <span>
                    {mentorStatus === "PENDING"
                      ? "멘토 승인 대기 중"
                      : "신청 가능"}
                  </span>
                </div>
                <p>관리자 승인 후 멘토로 활동할 수 있습니다.</p>
              </div>
            </div>
          )}

          {isEditing && (
            <div className={styles.editActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => setIsEditing(false)}
                disabled={isSubmitting}
              >
                취소
              </button>
              <button
                type="button"
                className={styles.saveButton}
                onClick={handleSaveProfile}
                disabled={isSubmitting}
              >
                {isSubmitting ? "저장 중..." : "저장하기"}
              </button>
            </div>
          )}
        </section>

        <section className={styles.managementCard}>
          <h2>프로필 관리</h2>

          <div className={styles.managementList}>
            <div className={styles.managementItem}>
              <div className={styles.itemIcon}>🔍</div>
              <div className={styles.itemContent}>
                <strong>조회</strong>
                <p>현재 등록된 정보를 확인합니다.</p>
              </div>
              <button type="button" className={styles.outlineButton}>
                정보 조회
              </button>
            </div>

            <div className={styles.managementItem}>
              <div className={styles.itemIcon}>✏️</div>
              <div className={styles.itemContent}>
                <strong>수정</strong>
                <p>이름, 연락처, 소개를 변경할 수 있습니다.</p>
              </div>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => setIsEditing(true)}
              >
                프로필 수정
              </button>
            </div>

            <div className={`${styles.managementItem} ${styles.dangerItem}`}>
              <div className={`${styles.itemIcon} ${styles.dangerIcon}`}>👤❌</div>
              <div className={styles.itemContent}>
                <strong className={styles.dangerText}>탈퇴</strong>
                <p>탈퇴 시 계정 정보와 활동 내역은 복구되지 않습니다.</p>
              </div>
              <button
                type="button"
                className={styles.dangerButton}
                onClick={handleDeleteAccount}
              >
                회원 탈퇴
              </button>
            </div>

            {user.role === "USER" && (
              <div className={styles.managementItem}>
                <div className={`${styles.itemIcon} ${styles.mentorIcon}`}>🏅</div>
                <div className={styles.itemContent}>
                  <strong>멘토 신청</strong>
                  <p>
                    {mentorStatus === "PENDING"
                      ? "승인 심사가 진행 중입니다."
                      : "멘토로 활동하기 위한 신청을 진행합니다."}
                  </p>
                </div>
                {mentorStatus === "PENDING" ? (
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={handleCancelMentor}
                  >
                    신청 취소
                  </button>
                ) : (
                  <button
                    type="button"
                    className={styles.mentorButton}
                    onClick={handleApplyMentor}
                  >
                    신청하기
                  </button>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      {user.role === "ADMIN" && (
        <section
          className={styles.profileCard}
          style={{ marginTop: "36px", borderColor: "#10b981" }}
        >
          <div className={styles.cardHeading}>
            <h1 style={{ color: "#059669" }}>🛡️ 멘토 신청 대기 목록 (관리자 전용)</h1>
          </div>

          {mentorApps.length === 0 ? (
            <p style={{ marginTop: "20px", color: "#64748b" }}>
              현재 승인 대기 중인 멘토 신청자가 없습니다.
            </p>
          ) : (
            <div className={styles.managementList} style={{ marginTop: "20px" }}>
              {mentorApps.map((app) => (
                <div key={app.id} className={styles.managementItem}>
                  <div className={styles.itemIcon}>👤</div>
                  <div className={styles.itemContent}>
                    <strong>{app.name}</strong>
                    <p>이메일: {app.email}</p>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      className={styles.primaryButton}
                      onClick={() => handleApprove(app.id)}
                    >
                      승인
                    </button>
                    <button
                      type="button"
                      className={styles.dangerButton}
                      onClick={() => handleReject(app.id)}
                    >
                      거절
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}