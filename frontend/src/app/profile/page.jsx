"use client";

import { FaUserLarge } from "react-icons/fa6";
import { useProfileActions } from "./useProfileActions";
import styles from "./page.module.css";

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
    mentorApps,
    handleViewInfo,
    handleSaveProfile,
    handleApplyMentor,
    handleDeleteAccount,
    handleApprove,
    handleReject,
  } = useProfileActions();

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

  const roleLabel =
    user.role === "ADMIN"
      ? "관리자"
      : user.role === "MENTOR"
      ? "현직 전문가"
      : "일반 회원";

  const joinedAt = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "-";

  return (
    <main className={styles.page}>
      <div className={styles.contentGrid}>

        {/* ================= 좌측: 내 프로필 카드 ================= */}
        <section className={styles.profileCard}>
          <div className={styles.cardHeading}>
            <h1>내 프로필 (마이페이지)</h1>
            <span className={styles.privateText}>
              🔒 개인 정보는 본인만 확인할 수 있습니다
            </span>
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
                  value={form.name}
                  onChange={onChange("name")}
                  placeholder="이름"
                />
              ) : (
                <h2>{user.name}</h2>
              )}
              <div className={styles.roleLine}>
                <span>{roleLabel}</span>
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
                    value={form.email}
                    onChange={onChange("email")}
                    placeholder="이메일을 입력하세요"
                  />
                ) : (
                  user.email || "미등록"
                )}
              </dd>
            </div>
            <div>
              <dt>가입 일시</dt>
              <dd>{joinedAt}</dd>
            </div>
            <div>
              <dt>관심 분야</dt>
              <dd>
                {isEditing ? (
                    <select
                        className={styles.inlineInput}
                        value={form.interests}
                        onChange={onChange("interests")}
                    >
                      <option value="">관심 분야를 선택해주세요</option>
                      <option value="개발">개발</option>
                      <option value="멘토링">멘토링</option>
                      <option value="취업">취업</option>
                      <option value="기타">기타</option>
                    </select>
                ) : (
                    user.interests || "-"
                )}
              </dd>
            </div>
          </dl>

          {/* 이메일 미등록 안내 (카카오 로그인 등) */}
          {!user.email && !isEditing && (
            <div className={styles.mentorBanner}>
              <div className={styles.mentorBannerIcon}>✉️</div>
              <div className={styles.mentorBannerContent}>
                <div className={styles.mentorBannerTitle}>
                  <strong>이메일 미등록</strong>
                </div>
                <p>
                  결제 및 알림 수신을 위해 이메일을 등록해 주세요.{" "}
                  <button
                    type="button"
                    className={styles.linkButton}
                    onClick={() => setIsEditing(true)}
                  >
                    지금 등록하기
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* 멘토 승인 대기 배너 */}
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
                onClick={cancelEdit}
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
            {/* 1. 정보 조회 */}
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

            {/* 2. 프로필 수정 */}
            <div className={styles.managementItem}>
              <div className={styles.itemIcon}>✏️</div>
              <div className={styles.itemContent}>
                <strong>수정</strong>
                <p>이름, 이메일, 관심 분야를 변경할 수 있습니다.</p>
              </div>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => setIsEditing(true)}
                disabled={isEditing}
              >
                프로필 수정
              </button>
            </div>

            {/* 3. 멘토 신청 */}
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

            {/* 4. 회원 탈퇴 */}
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
          </div>
        </section>
      </div>

      {/* ================= 하단: 관리자 전용 승인/거절 영역 ================= */}
      {user.role === "ADMIN" && (
        <section
          className={styles.profileCard}
          style={{ marginTop: "36px", borderColor: "#10b981" }}
        >
          <div className={styles.cardHeading}>
            <h1 style={{ color: "#059669" }}>
              🛡️ 멘토 신청 대기 목록 (관리자 전용)
            </h1>
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
                    <p>이메일: {app.email || "미등록"}</p>
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