"use client";

import { useState } from "react";
import { FaUserLarge } from "react-icons/fa6";
import { useProfileActions } from "./useProfileActions";
import ProfilePaymentSection from "./ProfilePaymentSection";
import styles from "./page.module.css";

const TABS = ["프로필 정보", "활동 내역", "결제 수단 관리", "구독 관리", "보안 설정"];

export default function ProfilePage() {
  const {
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
    handleSaveProfile,
    handleApplyMentor,
    handleDeleteAccount,
    subscriptions,
  } = useProfileActions();

  const [activeTab, setActiveTab] = useState("프로필 정보");

  if (loading) return <main className={styles.page} />;

  if (!isLoggedIn || !user) {
    return (
      <main className={styles.page}>
        <p style={{ textAlign: "center", padding: "40px" }}>로그인이 필요합니다.</p>
      </main>
    );
  }

  const roleLabel =
    user.role === "ADMIN" ? "관리자" : user.role === "MENTOR" ? "현직 멘토" : "일반 회원";

  const joinedAt = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("ko-KR").replace(/\.$/, "")
    : "-";

  const handle = user.email ? "@" + user.email.split("@")[0] : "@user";
  const tags = (user.interests || "").split(/[,#\s]+/).filter(Boolean);
  const notReady = () => alert("아직 준비 중인 기능입니다.");

  return (
    <main className={styles.page}>
      <div className={styles.pageHead}>
        <h1>🔒 내 프로필</h1>
        <span className={styles.privateText}>개인 정보는 본인만 확인할 수 있습니다.</span>
      </div>

      {/* ===== 히어로 ===== */}
      <section className={styles.hero}>
        <div className={styles.heroLeft}>
          <div className={styles.avatar} aria-hidden="true">
            <FaUserLarge />
          </div>
          <button type="button" className={styles.changeImgBtn} onClick={notReady}>
            📷 프로필 이미지 변경
          </button>
        </div>

        <div className={styles.heroMid}>
          <div className={styles.nameRow}>
            <h2>{user.name}</h2>
            <span className={styles.roleBadge}>{roleLabel}</span>
          </div>
          <div className={styles.handle}>{handle}</div>
          <p className={styles.bio}>
            {user.interests
              ? `관심 분야: ${user.interests}`
              : "소개가 아직 등록되지 않았습니다."}
          </p>
          <div className={styles.meta}>📁 전문 분야 {tags.length ? tags.join(", ") : "미등록"}</div>
          <div className={styles.meta}>📅 MentorBridge 가입일 {joinedAt}</div>
        </div>

        <div className={styles.stats}>
          {[
            ["팔로워", "-"],
            ["팔로잉", "-"],
            ["작성 질문", "-"],
            ["작성 답변", "-"],
            ["받은 좋아요", "-"],
          ].map(([lbl, num]) => (
            <div key={lbl} className={styles.stat}>
              <div className={styles.statNum}>{num}</div>
              <div className={styles.statLbl}>{lbl}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== 탭 ===== */}
      <nav className={styles.tabs}>
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            className={`${styles.tab} ${activeTab === t ? styles.tabActive : ""}`}
            onClick={() => setActiveTab(t)}
          >
            {t}
          </button>
        ))}
      </nav>

      {/* ===== 2단 콘텐츠 ===== */}
      <div className={styles.grid}>
        {/* 좌측 */}
        <div className={styles.col}>
          {/* 기본 정보 */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>기본 정보</h2>

            <InfoRow label="이름">
              {isEditing ? (
                <input className={styles.inlineInput} value={form.name} onChange={onChange("name")} />
              ) : (
                user.name
              )}
            </InfoRow>

            <InfoRow label="이메일">
              {isEditing ? (
                <input className={styles.inlineInput} value={form.email} onChange={onChange("email")} />
              ) : (
                user.email || <span className={styles.muted}>미등록</span>
              )}
            </InfoRow>

            <InfoRow label="닉네임">
              <span className={styles.muted}>{handle}</span>
            </InfoRow>

            <InfoRow label="전문 분야">
              {isEditing ? (
                <input
                  className={styles.inlineInput}
                  value={form.interests}
                  onChange={onChange("interests")}
                  placeholder="쉼표로 구분 (예: 백엔드, Spring Boot, Java)"
                />
              ) : tags.length ? (
                <div className={styles.tags}>
                  {tags.map((t) => (
                    <span key={t} className={styles.tag}>
                      #{t}
                    </span>
                  ))}
                </div>
              ) : (
                <span className={styles.muted}>미등록</span>
              )}
            </InfoRow>

            <InfoRow label="가입일">{joinedAt}</InfoRow>

            {isEditing ? (
              <div className={styles.editActions}>
                <button type="button" className={styles.cancelButton} onClick={cancelEdit} disabled={isSubmitting}>
                  취소
                </button>
                <button type="button" className={styles.saveButton} onClick={handleSaveProfile} disabled={isSubmitting}>
                  {isSubmitting ? "저장 중..." : "저장하기"}
                </button>
              </div>
            ) : (
              <div className={styles.editActions}>
                <button type="button" className={styles.editBtn} onClick={() => setIsEditing(true)}>
                  프로필 수정
                </button>
              </div>
            )}
          </section>

          {/* 보안 설정 */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>보안 설정</h2>
            <button type="button" className={styles.rowLink} onClick={notReady}>
              <span className={styles.rowIcon}>🔒</span>
              <span className={styles.rowText}>
                <strong>비밀번호 변경</strong>
                <p>계정 비밀번호를 변경합니다.</p>
              </span>
              <span className={styles.chev}>›</span>
            </button>
            <button type="button" className={styles.rowLink} onClick={notReady}>
              <span className={styles.rowIcon}>🔔</span>
              <span className={styles.rowText}>
                <strong>알림 설정</strong>
                <p>이메일 및 푸시 알림 설정을 관리합니다.</p>
              </span>
              <span className={styles.chev}>›</span>
            </button>
          </section>
        </div>

        {/* 우측 */}
        <div className={styles.col}>
          {/* 결제 수단 관리 (실제 백엔드 연동) */}
          <ProfilePaymentSection />

          {/* 구독 현황 */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>구독 현황</h2>
            {subscriptions.length === 0 ? (
              <p className={styles.muted} style={{ marginTop: 8 }}>
                구독 중인 멘토가 없습니다.
              </p>
            ) : (
              subscriptions.slice(0, 3).map((sub) => {
                const subId = sub.subscriptionId || sub.id;
                const mentorName = sub.mentorName || sub.name || `멘토 #${sub.mentorId || subId}`;
                const started = sub.currentPeriodStart || sub.createdAt;
                return (
                  <div key={subId} style={{ marginTop: 12 }}>
                    <div className={styles.subHead}>
                      <div className={styles.subCrown}>👑</div>
                      <div style={{ flex: 1 }}>
                        <strong>{mentorName} 구독</strong>
                        {started && (
                          <div className={styles.subBetween}>
                            <span className={styles.muted}>구독 시작일</span>
                            <span>{new Date(started).toLocaleDateString("ko-KR")}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </section>

          {/* 계정 관리 */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>계정 관리</h2>

            <button type="button" className={styles.rowLink} onClick={() => setIsEditing(true)}>
              <span className={styles.rowIcon}>👤</span>
              <span className={styles.rowText}>
                <strong>프로필 정보 수정</strong>
                <p>이름, 이메일, 전문 분야 등 프로필 정보를 수정합니다.</p>
              </span>
              <span className={styles.chev}>›</span>
            </button>

            {user.role === "USER" && !hasAppliedMentor && (
              <button type="button" className={styles.rowLink} onClick={handleApplyMentor}>
                <span className={styles.rowIcon}>🏅</span>
                <span className={styles.rowText}>
                  <strong>멘토 신청</strong>
                  <p>멘토로 활동하기 위한 신청을 진행합니다.</p>
                </span>
                <span className={styles.chev}>›</span>
              </button>
            )}
            {user.role === "USER" && hasAppliedMentor && (
              <button type="button" className={styles.rowLink} onClick={notReady}>
                <span className={styles.rowIcon}>📋</span>
                <span className={styles.rowText}>
                  <strong>멘토 승인 대기 중</strong>
                  <p>관리자 승인 후 멘토로 활동할 수 있습니다.</p>
                </span>
                <span className={styles.chev}>›</span>
              </button>
            )}

            <button type="button" className={`${styles.rowLink} ${styles.danger}`} onClick={handleDeleteAccount}>
              <span className={styles.rowIcon}>❌</span>
              <span className={styles.rowText}>
                <strong>회원 탈퇴</strong>
                <p>계정과 모든 데이터를 삭제합니다.</p>
              </span>
              <span className={styles.chev}>›</span>
            </button>
          </section>
        </div>
      </div>
    </main>
  );
}

// 기본 정보의 한 줄 (라벨 / 값)
function InfoRow({ label, children }) {
  return (
    <div className={styles.infoRow}>
      <span className={styles.infoLabel}>{label}</span>
      <span className={styles.infoValue}>{children}</span>
    </div>
  );
}
