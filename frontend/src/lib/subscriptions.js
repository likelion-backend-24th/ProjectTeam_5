import { request } from "./client";

/**
 * 내 구독 목록 조회 API
 */
export function getMySubscriptions() {
  return request("/api/v1/subscriptions/me", {
    method: "GET",
    fallbackMessage: "구독 목록을 불러오지 못했습니다.",
  });
}

/**
 * 멘토 구독 신청 API
 */
export function subscribeMentor(mentorId) {
  return request("/api/v1/subscriptions", {
    method: "POST",
    body: { mentorId: Number(mentorId) },
    fallbackMessage: "구독 신청 처리에 실패했습니다.",
  });
}

/**
 * 멘토 구독 해지 API
 */
export function unsubscribeMentor(subscriptionId) {
  return request(`/api/v1/subscriptions/${subscriptionId}/cancel`, {
    method: "PATCH",
    fallbackMessage: "구독 해지 처리에 실패했습니다.",
  });
}

/**
 * 멘토 전용 게시글 조회 API
 */
export function getMentorPost(mentorId, postId) {
  return request(`/api/v1/mentors/${mentorId}/posts/${postId}`, {
    method: "GET",
    fallbackMessage: "게시글을 불러오지 못했습니다.",
  });
}