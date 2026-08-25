"use client";

import { MENTOR_CATEGORIES, CAREER_LEVELS, normalizeCategories } from "@/constants/mentorOptions";
import styles from "../page.module.css";

export default function MentorInfoCard({ mentorInfo, isEditing, editForm, onChange, plans }) {
  // 멘토피드 필터와 같은 목록에서 고르게 한다. 자유 입력이면 필터에 걸리지 않기 때문이다.
  // 목록에 없는 예전 값은 여기서 걸러내고, 저장할 때도 같은 기준으로 정리된다.
  const selectedCategories = normalizeCategories(editForm.tags);

  // 부모(page.jsx)의 handleInputChange가 e.target.{name,value}만 보므로 같은 모양으로 넘긴다.
  const emitTags = (nextList) => {
    onChange({ target: { name: "tags", value: nextList.join(", ") } });
  };

  const toggleCategory = (category) => {
    const next = selectedCategories.includes(category)
      ? selectedCategories.filter((item) => item !== category)
      : [...selectedCategories, category];
    emitTags(next);
  };

  return (
    <div className={styles.sidebarCard}>
      <h3>멘토 정보</h3>
      <ul className={styles.infoList}>
        <li>
          <strong>현직</strong>
          {isEditing ? (
            <input type="text" name="company" value={editForm.company} onChange={onChange} className={styles.editInput} />
          ) : (
            <span>{mentorInfo.company || "미등록"}</span>
          )}
        </li>
        <li>
          <strong>경력</strong>
          {isEditing ? (
            <select name="career" value={editForm.career} onChange={onChange} className={styles.editInput}>
              <option value="">선택 안 함</option>
              {CAREER_LEVELS.map((level) => (
                <option key={level.code} value={level.value}>
                  {level.value}
                </option>
              ))}
            </select>
          ) : (
            <span>{mentorInfo.career || "미등록"}</span>
          )}
        </li>
        <li>
          <strong>전문 분야</strong>
          {isEditing ? (
            <div className={styles.categoryPicker}>
              {MENTOR_CATEGORIES.map((category) => (
                <label key={category} className={styles.categoryOption}>
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category)}
                    onChange={() => toggleCategory(category)}
                  />
                  <span>{category}</span>
                </label>
              ))}
            </div>
          ) : (
            <span>{mentorInfo.tags || "미등록"}</span>
          )}
        </li>
        <li>
          <strong>학력</strong>
          {isEditing ? (
            <input type="text" name="education" value={editForm.education} onChange={onChange} className={styles.editInput} />
          ) : (
            <span>{mentorInfo.education || "미등록"}</span>
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
