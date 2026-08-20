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
 * 구독 결제 준비 — 요금제를 정해서 결제 시도(Payment READY)를 만든다.
 * 성공하면 PortOne 결제창(requestPayment)에 그대로 넘길 값들을 받는다.
 */
export function prepareSubscription(mentorId, planId) {
  return request(`/api/v1/subscriptions?planid=${planId}`, {
    method: "POST",
    body: { mentorId: Number(mentorId) },
    fallbackMessage: "구독 신청 처리에 실패했습니다.",
  });
}

/**
 * 결제창 완료 후 서버 검증 — 여기서 확정돼야 구독이 ACTIVE가 된다.
 */
export function completePayment(paymentId) {
  return request(`/api/v1/payments/${paymentId}/complete`, {
    method: "POST",
    fallbackMessage: "결제 확인에 실패했습니다.",
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