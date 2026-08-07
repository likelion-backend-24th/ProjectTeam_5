import { request } from "./client";

// 아티클 목록 조회 (피드)
export async function getMentorArticles({ page = 0, size = 10, category = "" } = {}) {
  const query = new URLSearchParams({ page, size, ...(category && { category }) }).toString();
  return request(`/api/mentor-articles?${query}`, {
    method: "GET",
    fallbackMessage: "칼럼 목록을 불러오지 못했습니다.",
  });
}

// 아티클 상세 조회
export async function getMentorArticle(id) {
  return request(`/api/mentor-articles/${id}`, {
    method: "GET",
    fallbackMessage: "칼럼을 불러오지 못했습니다.",
  });
}

// 아티클 작성 (멘토 전용)
export async function createMentorArticle(data) {
  return request("/api/mentor-articles", {
    method: "POST",
    body: data,
    fallbackMessage: "칼럼 작성에 실패했습니다.",
  });
}

// 아티클 수정 (작성자 멘토 전용)
export async function updateMentorArticle(id, data) {
  return request(`/api/mentor-articles/${id}`, {
    method: "PATCH",
    body: data,
    fallbackMessage: "칼럼 수정에 실패했습니다.",
  });
}

// 아티클 삭제 (작성자 멘토 전용)
export async function deleteMentorArticle(id) {
  return request(`/api/mentor-articles/${id}`, {
    method: "DELETE",
    fallbackMessage: "칼럼 삭제에 실패했습니다.",
  });
}

// 댓글/답변 목록 조회
export async function getArticleComments(articleId) {
  return request(`/api/mentor-articles/${articleId}/comments`, {
    method: "GET",
    fallbackMessage: "댓글 목록을 불러오지 못했습니다.",
  });
}

// 댓글/답변 등록
export async function createArticleComment(articleId, data) {
  return request(`/api/mentor-articles/${articleId}/comments`, {
    method: "POST",
    body: data,
    fallbackMessage: "댓글 등록에 실패했습니다.",
  });
}

// 댓글/답변 삭제
export async function deleteArticleComment(commentId) {
  return request(`/api/article-comments/${commentId}`, {
    method: "DELETE",
    fallbackMessage: "댓글 삭제에 실패했습니다.",
  });
}