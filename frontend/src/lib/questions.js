import { request } from "./client";
import { getAccessToken } from "./tokenStore";

export async function getQuestion(id) {
  return request(`/api/questions/${id}`, {
    method: "GET",
    fallbackMessage: "질문을 불러오지 못했습니다.",
  });
}

export async function getAnswers(id) {
  return request(`/api/questions/${id}/answers`, {
    method: "GET",
    fallbackMessage: "답변을 불러오지 못했습니다.",
  });
}

// 수정된 부분: keyword, sort 파라미터 추가 및 쿼리스트링 조합 (mostAnswers 매핑 포함)
export function getQuestions({ page = 0, size = 10, category = "전체", keyword = "", sort = "latest" }) {
  const categoryQuery = category !== "전체" ? `&category=${encodeURIComponent(category)}` : "";
  const keywordQuery = keyword && keyword.trim() !== "" ? `&keyword=${encodeURIComponent(keyword)}` : "";
  
  // 백엔드 정렬 조건 매핑
  let sortParam = "createdAt,desc";
  if (sort === "oldest") sortParam = "createdAt,asc";
  if (sort === "mostLikes") sortParam = "likeCount,desc";
  if (sort === "mostAnswers") sortParam = "answerCount,desc"; // 🚀 답변 많은순 매핑 추가됨

  return request(
    `/api/questions?page=${page}&size=${size}&sort=${sortParam}${categoryQuery}${keywordQuery}`,
    {
      method: "GET",
      fallbackMessage: "질문 목록을 불러오지 못했습니다.",
    }
  );
}

export async function createAnswer(questionId, data) {
  return request(`/api/questions/${questionId}/answers`, {
    method: "POST",
    body: data,
    fallbackMessage: "답변 등록에 실패했습니다.",
  });
}

export async function updateAnswer(answerId, data) {
  return request(`/api/answers/${answerId}`, {
    method: "PATCH",
    body: data,
    fallbackMessage: "답변 수정에 실패했습니다.",
  });
}

export async function deleteAnswer(answerId) {
  return request(`/api/answers/${answerId}`, {
    method: "DELETE",
    fallbackMessage: "답변 삭제에 실패했습니다.",
  });
}

export async function createQuestion(title, content, category, attachmentIds = []) {
  return request("/api/questions", {
    method: "POST",
    body: { title, content, category, attachmentIds },
    fallbackMessage: "질문 등록에 실패했습니다.",
  });
}

export async function updateQuestion(id, title, content, category, attachmentIds = []) {
  return request(`/api/questions/${id}`, {
    method: "PATCH",
    body: { title, content, category, attachmentIds },
    fallbackMessage: "질문 수정에 실패했습니다.",
  });
}

export async function deleteQuestion(id) {
  return request(`/api/questions/${id}`, {
    method: "DELETE",
    fallbackMessage: "질문 삭제에 실패했습니다.",
  });
}

// 좋아요 토글
export async function toggleLike(questionId) {
  return request(`/api/questions/${questionId}/like`, {
    method: "POST",
    fallbackMessage: "좋아요 처리에 실패했습니다.",
  });
}

// 팔로잉 유저 질문 목록 조회
export async function getFollowingQuestions({ page = 0, size = 10 } = {}) {
  const token = getAccessToken();
  const query = new URLSearchParams({ page, size }).toString();
  return request(`/api/questions/following?${query}`, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    fallbackMessage: "팔로잉 유저의 질문 목록을 불러오지 못했습니다.",
  });
}