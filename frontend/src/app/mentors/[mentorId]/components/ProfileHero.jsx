"use client";

import { DAYS_OF_WEEK, MAX_BIO_LENGTH, parseScheduleMap } from "../utils";
import styles from "../page.module.css";
import { DEFAULT_PROFILE_IMAGE, fallbackToDefaultProfile } from "@/constants/images";

export default function ProfileHero({
  mentorInfo,
  tagsArray,
  articlesCount,
  isAvailableNow,
  isEditing,
  editForm,
  onChange,
  onStartEdit,
  onCancelEdit,
  onSaveProfile,
  savingProfile,
  isOwner,
  isSubscribed,
  subscriptionStatus,
  currentPeriodEnd,
  onCancelSubscription,
  onOpenSubscribeModal,
  onConsultRequest,
  requestingConsult,
}) {
  const statusColor = isAvailableNow ? "#22c55e" : "#94a3b8";
  const scheduleMap = parseScheduleMap(mentorInfo.schedule);
  const activeDays = DAYS_OF_WEEK.filter((d) => scheduleMap[d]?.enabled);

  return (
    <section className={styles.profileBanner}>
      <div className={styles.heroLeft}>
        <div className={styles.avatarWrapper}>
          <img
            src={mentorInfo.profileImageUrl || DEFAULT_PROFILE_IMAGE}
            alt={mentorInfo.name || "멘토"}
            className={styles.avatar}
            onError={fallbackToDefaultProfile}
          />
          <span className={styles.onlineDot} style={{ backgroundColor: statusColor }} />
        </div>
        <div className={styles.heroText}>
          <h1 className={styles.mentorName}>{mentorInfo.name}</h1>
          {isEditing ? (
            <div className={styles.editWrapper}>
              <textarea name="bio" value={editForm.bio} onChange={onChange} maxLength={MAX_BIO_LENGTH} className={styles.editBioInput} />
              <p className={styles.charCount}>{editForm.bio.length} / {MAX_BIO_LENGTH}자</p>
            </div>
          ) : (
            <p className={styles.mentorBio}>{mentorInfo.bio || "소개글이 없습니다."}</p>
          )}
          <div className={styles.tagGroup}>
            {tagsArray.slice(0, 5).map((tag, i) => (
              <span key={i} className={styles.tag}>{tag}</span>
            ))}
          </div>
          <div className={styles.statsRow}>
            <span>
              <span className={styles.star}>★</span>{" "}
              {mentorInfo.reviewCount > 0 ? Number(mentorInfo.rating || 0).toFixed(1) : "신규"} ({mentorInfo.reviewCount || 0})
            </span>
            <span>♙ {mentorInfo.subscriberCount || 0} 구독자</span>
          </div>
        </div>
      </div>

      <div className={styles.heroRight}>
        <div className={styles.heroStats}>
          <div className={styles.statBox}>
            <span className={styles.statIcon}>▤</span>
            <span className={styles.statLabel}>게시글</span>
            <span className={styles.statValue}>{articlesCount}</span>
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
            <span className={styles.statValueSmall}>{activeDays.length > 0 ? activeDays.join(", ") : "미설정"}</span>
            <span className={styles.statSub}>요일별 운영</span>
          </div>
        </div>

        <div className={styles.actionBtns}>
          {isOwner ? (
            isEditing ? (
              <>
                <button className={styles.saveBtn} onClick={onSaveProfile} disabled={savingProfile}>
                  {savingProfile ? "저장 중..." : "저장"}
                </button>
                <button className={styles.cancelBtn} onClick={onCancelEdit}>취소</button>
              </>
            ) : (
              <button className={styles.editBtn} onClick={onStartEdit}>프로필 수정</button>
            )
          ) : (
            <>
              {isSubscribed ? (
                <div className={styles.subscribedBox}>
                  <button
                    className={`${styles.subBtn} ${subscriptionStatus === "CANCEL_RESERVED" ? styles.subBtnReserved : ""}`}
                    onClick={onCancelSubscription}
                  >
                    {subscriptionStatus === "CANCEL_RESERVED" ? "✓ 해지 예약됨" : "✓ 구독중"}
                  </button>
                  {subscriptionStatus === "CANCEL_RESERVED" && currentPeriodEnd && (
                    <span className={styles.subscribedUntil}>
                      (~{new Date(currentPeriodEnd).toLocaleDateString()}까지)
                    </span>
                  )}
                </div>
              ) : (
                <button className={styles.subBtn} onClick={onOpenSubscribeModal}>구독하기</button>
              )}
              <button className={styles.consultBtn} onClick={onConsultRequest} disabled={requestingConsult}>
                {requestingConsult ? "연결 중..." : "상담 신청"}
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
