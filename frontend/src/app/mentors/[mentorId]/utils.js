export const DAYS_OF_WEEK = ["월", "화", "수", "목", "금", "토", "일"];
export const MAX_BIO_LENGTH = 500;

export function parseScheduleMap(scheduleStr = "") {
  const scheduleMap = {};
  DAYS_OF_WEEK.forEach((day) => {
    scheduleMap[day] = { enabled: false, startTime: "10:00", endTime: "17:00" };
  });

  if (!scheduleStr) return scheduleMap;

  const matches = [...scheduleStr.matchAll(/([월화수목금토일])\s*\(([^)]+)\)/g)];
  if (matches.length > 0) {
    matches.forEach((match) => {
      const day = match[1];
      const timeRange = match[2];
      const [start = "10:00", end = "17:00"] = timeRange.split("-").map((t) => t.trim());
      if (scheduleMap[day]) {
        scheduleMap[day] = { enabled: true, startTime: start, endTime: end };
      }
    });
  } else {
    const dayPart = scheduleStr.split("(")[0] || "";
    const timePart = scheduleStr.match(/\((.*?)\)/)?.[1] || "10:00 - 17:00";
    const [start = "10:00", end = "17:00"] = timePart.split("-").map((t) => t.trim());

    DAYS_OF_WEEK.forEach((day) => {
      if (dayPart.includes(day)) {
        scheduleMap[day] = { enabled: true, startTime: start, endTime: end };
      }
    });
  }
  return scheduleMap;
}

export function stringifyScheduleMap(scheduleMap) {
  const parts = [];
  DAYS_OF_WEEK.forEach((day) => {
    if (scheduleMap[day]?.enabled) {
      parts.push(`${day}(${scheduleMap[day].startTime} - ${scheduleMap[day].endTime})`);
    }
  });
  return parts.length > 0 ? parts.join(", ") : "상담 시간 미설정";
}

export function checkIsAvailable(scheduleStr) {
  if (!scheduleStr) return false;
  const now = new Date();
  const daysMap = ["일", "월", "화", "수", "목", "금", "토"];
  const todayStr = daysMap[now.getDay()];

  const scheduleMap = parseScheduleMap(scheduleStr);
  const todayInfo = scheduleMap[todayStr];
  if (!todayInfo || !todayInfo.enabled) return false;

  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [startH, startM] = todayInfo.startTime.split(":").map(Number);
  const [endH, endM] = todayInfo.endTime.split(":").map(Number);

  return currentTime >= startH * 60 + startM && currentTime <= endH * 60 + endM;
}

// fetchData/handleSaveProfile/handlePostSubmit/confirmCancelSubscription가 각자 거의 같은 헤더
// 객체를 반복해서 만들고 있던 걸 한 곳으로 모았다.
export function buildAuthHeaders({ token, userId, json = false } = {}) {
  return {
    ...(json && { "Content-Type": "application/json" }),
    ...(userId && { "X-USER-ID": String(userId) }),
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}
