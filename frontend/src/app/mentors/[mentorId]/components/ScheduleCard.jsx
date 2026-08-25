"use client";

import { DAYS_OF_WEEK, parseScheduleMap, stringifyScheduleMap } from "../utils";
import styles from "../page.module.css";

export default function ScheduleCard({ mentorInfo, isEditing, editForm, onScheduleChange, isAvailableNow }) {
  // ⚠️ 예전엔 이 값을 아래 두 DAYS_OF_WEEK.map() 콜백 안에서 매 요일마다 다시 계산해서(하루에 최대 14회)
  // 정규식 파싱을 반복했다 — 편집 모드 렌더링마다 한 번만 계산해서 재사용하도록 끌어올렸다.
  const editScheduleMap = isEditing ? parseScheduleMap(editForm.schedule) : null;
  const viewScheduleMap = !isEditing ? parseScheduleMap(mentorInfo.schedule) : null;
  const viewActiveDays = viewScheduleMap ? DAYS_OF_WEEK.filter((day) => viewScheduleMap[day]?.enabled) : [];

  const updateDay = (day, patch) => {
    const nextMap = { ...editScheduleMap, [day]: { ...editScheduleMap[day], ...patch } };
    onScheduleChange(stringifyScheduleMap(nextMap));
  };

  return (
    <div className={styles.sidebarCard}>
      <div className={styles.scheduleHeader}>
        <h3>상담 가능 시간</h3>
        <span className={styles.available} style={{ color: isAvailableNow ? "#22c55e" : "#94a3b8" }}>
          ● 오늘 기준 {isAvailableNow ? "상담 가능" : "상담 불가"}
        </span>
      </div>

      {isEditing ? (
        <div className={styles.scheduleEditContainer}>
          <label className={styles.editSubLabel}>요일 및 시간 개별 설정</label>
          <div className={styles.dayPillGroup}>
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = editScheduleMap[day]?.enabled;
              return (
                <button
                  key={day}
                  type="button"
                  className={`${styles.dayPill} ${isSelected ? styles.dayPillActive : ""}`}
                  onClick={() => updateDay(day, { enabled: !isSelected })}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className={styles.dayTimeConfigList}>
            {DAYS_OF_WEEK.map((day) => {
              if (!editScheduleMap[day]?.enabled) return null;
              return (
                <div key={day} className={styles.dayTimeRow}>
                  <span className={styles.dayBadge}>{day}요일</span>
                  <div className={styles.timeInputWrapper}>
                    <input
                      type="time"
                      value={editScheduleMap[day].startTime}
                      onChange={(e) => updateDay(day, { startTime: e.target.value })}
                      className={styles.roundedTimeInput}
                    />
                    <span className={styles.timeWave}>~</span>
                    <input
                      type="time"
                      value={editScheduleMap[day].endTime}
                      onChange={(e) => updateDay(day, { endTime: e.target.value })}
                      className={styles.roundedTimeInput}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className={styles.scheduleViewBox}>
          {viewActiveDays.length === 0 ? (
            <div className={styles.scheduleText}>{mentorInfo.schedule || "등록된 상담 가능 시간이 없습니다."}</div>
          ) : (
            <div className={styles.scheduleList}>
              {viewActiveDays.map((day) => (
                <div key={day} className={styles.scheduleRowItem}>
                  <span className={styles.scheduleDay}>{day}요일</span>
                  <span className={styles.scheduleTime}>
                    {viewScheduleMap[day].startTime} ~ {viewScheduleMap[day].endTime}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <p className={styles.scheduleNotice}>* 예약은 상담 신청 버튼을 통해 가능합니다.</p>
    </div>
  );
}
