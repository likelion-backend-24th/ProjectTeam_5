// 멘토피드의 필터와 멘토 정보 입력 폼이 "같은 목록"을 보도록 한 곳에 모아둔다.
//
// 예전에는 필터는 고정 목록(개발/디자인/…)인데 입력은 자유 텍스트("백엔드")라,
// 어느 항목을 골라도 걸리는 멘토가 없어 필터가 사실상 동작하지 않았다.

export const MENTOR_CATEGORIES = [
  "개발",
  "데이터 사이언스",
  "디자인",
  "마케팅",
  "커리어",
  "창업",
  "기타",
];

// 필터 사이드바용 — 맨 앞에 "전체"가 붙은 형태
export const CATEGORY_FILTER_OPTIONS = ["전체", ...MENTOR_CATEGORIES];

// value가 DB(MentorProfile.career)에 그대로 저장되는 문자열이다.
export const CAREER_LEVELS = [
  { value: "신입 (1~3년)", code: "JUNIOR", min: 1, max: 3 },
  { value: "주니어 (3~7년)", code: "MID", min: 3, max: 7 },
  { value: "시니어 (7~15년)", code: "SENIOR", min: 7, max: 15 },
  { value: "전문가 (15년+)", code: "EXPERT", min: 15, max: Infinity },
];

export const CAREER_FILTER_OPTIONS = [
  { label: "전체", value: "전체" },
  ...CAREER_LEVELS.map((level) => ({ label: level.value, value: level.code })),
];

/** "개발, 디자인" → ["개발", "디자인"] */
export function splitTags(raw) {
  if (Array.isArray(raw)) return raw.map((t) => String(t).trim()).filter(Boolean);
  if (!raw) return [];
  return String(raw)
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

/**
 * 공식 분야 목록에 있는 값만 남긴다.
 * 체크박스에 없는 값(예전에 자유 입력한 "백엔드")은 화면에서 끌 수단이 없으므로
 * 저장 시점에 정리한다. 필터가 보는 목록과 저장되는 값을 항상 일치시키기 위한 것이다.
 */
export function normalizeCategories(raw) {
  const seen = new Set();
  return splitTags(raw).filter(
    (tag) => MENTOR_CATEGORIES.includes(tag) && !seen.has(tag) && seen.add(tag)
  );
}

/**
 * 저장된 경력 문자열을 필터 코드(JUNIOR/MID/SENIOR/EXPERT)로 바꾼다.
 * 드롭다운에서 고른 값이면 그대로 매칭되고, 예전에 자유 입력한 "3년" 같은 값은
 * 숫자를 뽑아 구간으로 판정한다. 둘 다 아니면 null.
 */
export function careerCodeOf(careerText) {
  if (!careerText) return null;
  const text = String(careerText).trim();

  const exact = CAREER_LEVELS.find((level) => level.value === text);
  if (exact) return exact.code;

  const matched = text.match(/\d+/);
  if (!matched) return null;

  const years = Number(matched[0]);
  const bucket = CAREER_LEVELS.find((level) => years >= level.min && years < level.max);
  return bucket ? bucket.code : null;
}
