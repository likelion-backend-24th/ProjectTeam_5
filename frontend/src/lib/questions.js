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

export function getQuestions({ page = 0, size = 10 }) {
  return request(
    `/api/questions?page=${page}&size=${size}&sort=createdAt,desc`,
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

export async function createQuestion(title, content) {
  return request("/api/questions", {
    method: "POST",
    body: { title, content },
    fallbackMessage: "질문 등록에 실패했습니다.",
  });
}

export async function updateQuestion(id, title, content) {
  return request(`/api/questions/${id}`, {
    method: "PUT",
    body: { title, content },
    fallbackMessage: "질문 수정에 실패했습니다.",
  });
}

export async function deleteQuestion(id) {
  return request(`/api/questions/${id}`, {
    method: "DELETE",
    fallbackMessage: "질문 삭제에 실패했습니다.",
  });
}
