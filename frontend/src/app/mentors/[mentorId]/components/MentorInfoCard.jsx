"use client";

import styles from "../page.module.css";

export default function MentorInfoCard({ mentorInfo, isEditing, editForm, onChange, plans }) {
  return (
    <div className={styles.sidebarCard}>
      <h3>멘토 정보</h3>
      <ul className={styles.infoList}>
        <li>
          <strong>현직</strong>
          {isEditing ? (
            <input type="text" name="company" value={editForm.company} onChange={onChange} className={styles.editInput} />
          ) : (
            <span>{mentorInfo.company || "Senior UI/UX Designer @ 멋사"}</span>
          )}
        </li>
        <li>
          <strong>경력</strong>
          {isEditing ? (
            <input type="text" name="career" value={editForm.career} onChange={onChange} className={styles.editInput} />
          ) : (
            <span>{mentorInfo.career || "50년"}</span>
          )}
        </li>
        <li>
          <strong>전문 분야</strong>
          {isEditing ? (
            <input type="text" name="tags" value={editForm.tags} onChange={onChange} className={styles.editInput} placeholder="쉼표(,)로 구분" />
          ) : (
            <span>{mentorInfo.tags || "UI/UX, 프로토타이핑"}</span>
          )}
        </li>
        <li>
          <strong>학력</strong>
          {isEditing ? (
            <input type="text" name="education" value={editForm.education} onChange={onChange} className={styles.editInput} />
          ) : (
            <span>{mentorInfo.education || "멋사대학교 디자인과"}</span>
          )}
        </li>
        <li>
          <strong>포트폴리오 링크</strong>
          {isEditing ? (
            <input
              type="url"
              name="portfolioUrl"
              value={editForm.portfolioUrl}
              onChange={onChange}
              className={styles.editInput}
              placeholder="https://notion.so/... 또는 깃허브 주소"
            />
          ) : (
            <span>
              {mentorInfo.portfolioUrl ? (
                <a href={mentorInfo.portfolioUrl} target="_blank" rel="noopener noreferrer" className={styles.portfolioLink}>
                  {mentorInfo.portfolioUrl}
                </a>
              ) : (
                "등록된 링크가 없습니다."
              )}
            </span>
          )}
        </li>
        {isEditing && (
          <li>
            <strong>구독 요금제</strong>
            {plans.length === 0 ? (
              <span className={styles.noPlansTextSmall}>등록된 요금제가 없습니다.</span>
            ) : (
              <span className={styles.plansSummary}>
                {plans.map((p) => `${p.planName} 월 ${Number(p.price).toLocaleString()}원`).join(", ")}
              </span>
            )}
            <a href="/profile" className={styles.planManageLink}>
              요금제 등록·수정은 내 프로필 &gt; 구독 플랜 관리에서 →
            </a>
          </li>
        )}
      </ul>
    </div>
  );
}
