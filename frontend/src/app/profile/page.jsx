"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FaUserLarge } from "react-icons/fa6";
import { useAuth } from "@/app/contexts/AuthContext";
import styles from "./page.module.css";
import * as usersApi from "@/lib/users";
import { getToken, handleReject, handleViewInfo, handleSaveProfile, handleApplyMentor, handleDeleteAccount, handleApprove } from "@/lib/users";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoggedIn, loading, logout } = useAuth();

  // 1. 수정 모드 및 폼 상태 (이름, 이메일, 관심 분야)
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newInterests, setNewInterests] = useState("");
  const [interests, setInterests] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2. 멘토 신청 상태 (백엔드 상태와 연동하여 새로고침해도 유지됨)
  const [hasAppliedMentor, setHasAppliedMentor] = useState(false);

  // 3. 관리자(ADMIN) 전용 멘토 신청 대기 목록
  const [mentorApps, setMentorApps] = useState([]);


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

  // 유저 정보 로딩 및 멘토 신청 상태 복원
  useEffect(() => {
    let ignore = false;

    async function loadProfileData() {
      if (user) {
        setNewName(user.name || "");
        setNewEmail(user.email || "");
        if (user.interests) {
          setInterests(user.interests);
          setNewInterests(user.interests);
        } else {
          setInterests("백엔드, 멘토링");
          setNewInterests("백엔드, 멘토링");
        }

        const token = getToken();
        if (token) {
          try {
            // 새로고침 시에도 멘토 신청 대기 상태를 유지하기 위해 백엔드에서 상태 조회
            const app = await usersApi.getMyMentorApplication(token);
            if (!ignore && app && app.status === "PENDING") {
              setHasAppliedMentor(true);
            }
          } catch (err) {
            if (!ignore) {
              setHasAppliedMentor(false);
            }
          }
        }

        if (!ignore) {
          fetchAdminData();
        }
      }
    }

    loadProfileData();

    return () => {
      ignore = true;
    };
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


  return (
    <main className={styles.page}>
      <div className={styles.contentGrid}>
        
        {/* ================= 좌측: 내 프로필 카드 ================= */}
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
                <span>현직 전문가 • MENTOR</span>
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
              <dd>
                {new Date(user.createdAt || Date.now()).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </dd>
            </div>
            <div>
              <dt>관심 분야</dt>
              <dd>
                {isEditing ? (
                  <input
                    type="text"
                    className={styles.inlineInput}
                    value={newInterests}
                    onChange={(e) => setNewInterests(e.target.value)}
                    placeholder="예: 백엔드, 프론트엔드"
                  />
                ) : (
                  user.interests || interests
                )}
              </dd>
            </div>
          </dl>

          {/* 일반 유저(USER)이면서 멘토 신청을 진행한 경우에만 배너 노출 */}
          {user.role === "USER" && hasAppliedMentor && (
            <div className={styles.mentorBanner}>
              <div className={styles.mentorBannerIcon}>📋</div>
              <div className={styles.mentorBannerContent}>
                <div className={styles.mentorBannerTitle}>
                  <strong>멘토 신청</strong>
                  <span>멘토 승인 대기 중</span>
                </div>
                <p>관리자 승인 후 멘토로 활동할 수 있습니다.</p>
              </div>
            </div>
          )}

          {/* 수정 모드 버튼 영역 */}
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

        {/* ================= 우측: 프로필 관리 액션 카드 ================= */}
        <section className={styles.managementCard}>
          <h2>프로필 관리</h2>

          <div className={styles.managementList}>
            {/* 1. 조회 정보 버튼 */}
            <div className={styles.managementItem}>
              <div className={styles.itemIcon}>🔍</div>
              <div className={styles.itemContent}>
                <strong>조회</strong>
                <p>현재 등록된 정보를 확인합니다.</p>
              </div>
              <button
                type="button"
                className={styles.outlineButton}
                onClick={handleViewInfo}
              >
                정보 조회
              </button>
            </div>

            {/* 2. 수정 버튼 */}
            <div className={styles.managementItem}>
              <div className={styles.itemIcon}>✏️</div>
              <div className={styles.itemContent}>
                <strong>수정</strong>
                <p>이름, 연락처, 관심 분야를 변경할 수 있습니다.</p>
              </div>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => setIsEditing(true)}
              >
                프로필 수정
              </button>
            </div>

            {/* 3. 회원 탈퇴 버튼 */}
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

            {/* 4. 멘토 신청 버튼 */}
            {user.role === "USER" && !hasAppliedMentor && (
              <div className={styles.managementItem}>
                <div className={`${styles.itemIcon} ${styles.mentorIcon}`}>🏅</div>
                <div className={styles.itemContent}>
                  <strong>멘토 신청</strong>
                  <p>멘토로 활동하기 위한 신청을 진행합니다.</p>
                </div>
                <button
                  type="button"
                  className={styles.mentorButton}
                  onClick={handleApplyMentor}
                >
                  신청하기
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ================= 하단: 관리자(ADMIN) 전용 승인/거절 영역 ================= */}
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