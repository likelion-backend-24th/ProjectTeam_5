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
  return request(`/api/questions?page=${page}&size=${size}&sort=createdAt,desc`, {
    method: "GET",
    fallbackMessage: "질문 목록을 불러오지 못했습니다.",
  });
}
