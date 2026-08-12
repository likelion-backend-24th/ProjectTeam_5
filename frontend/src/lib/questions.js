import { request } from "./client";

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

// 수정된 부분: URL에 category 쿼리 스트링 추가
export function getQuestions({ page = 0, size = 10, category = "전체" }) {
  const categoryQuery = category !== "전체" ? `&category=${encodeURIComponent(category)}` : "";

  return request(
      `/api/questions?page=${page}&size=${size}&sort=createdAt,desc${categoryQuery}`,
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

// 수정된 부분: category 파라미터 추가 및 body에 포함, attachmentIds 추가
export async function createQuestion(title, content, category, attachmentIds = []) {
  return request("/api/questions", {
    method: "POST",
    body: { title, content, category, attachmentIds },
    fallbackMessage: "질문 등록에 실패했습니다.",
  });
}

// 수정된 부분: category 파라미터 추가 및 body에 포함
// 변경 전: updateQuestion(id, title, content, category)
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