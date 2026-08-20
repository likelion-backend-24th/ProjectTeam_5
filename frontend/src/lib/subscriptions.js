import { request } from "./client";

// 내 구독 목록 조회 API
export function getMySubscriptions() {
  return request("/api/v1/subscriptions/me", {
    method: "GET",
    fallbackMessage: "구독 목록을 불러오지 못했습니다.",
  });
}

// 구독 신청 — 등록된 카드로 서버가 즉시 청구하고 최종 결과까지 한 번에 돌려준다(결제창 팝업 없음).
// 등록된 결제수단이 없으면 PAYMENT_METHOD_REQUIRED 에러가 온다 — 카드 등록 화면으로 보내야 한다.
export function subscribeToMentor(mentorId, planId) {
  return request(`/api/v1/subscriptions?planid=${planId}`, {
    method: "POST",
    body: { mentorId: Number(mentorId) },
    fallbackMessage: "구독 신청 처리에 실패했습니다.",
  });
}

// 멘토 구독 해지 API — 다음 회차 예약도 같이 취소된다.
export function unsubscribeMentor(subscriptionId) {
  return request(`/api/v1/subscriptions/${subscriptionId}/cancel`, {
    method: "PATCH",
    fallbackMessage: "구독 해지 처리에 실패했습니다.",
  });
}

// 구독의 결제 이력 조회 (환불 요청 대상 선택용)
export function getPaymentHistory(subscriptionId) {
  return request(`/api/v1/subscriptions/${subscriptionId}/payments`, {
    method: "GET",
    fallbackMessage: "결제 이력을 불러오지 못했습니다.",
  });
}

// 환불 요청 — 관리자 승인이 있어야 실제로 취소·환불된다.
export function requestRefund(paymentId, reason) {
  return request(`/api/v1/payments/${paymentId}/cancellations`, {
    method: "POST",
    body: { reason },
    fallbackMessage: "환불 요청에 실패했습니다.",
  });
}

// 내 환불 요청 이력
export function getMyCancellations() {
  return request("/api/v1/payments/cancellations/me", {
    method: "GET",
    fallbackMessage: "환불 요청 이력을 불러오지 못했습니다.",
  });
}

// 멘토 전용 게시글 조회 API
export function getMentorPost(mentorId, postId) {
  return request(`/api/v1/mentors/${mentorId}/posts/${postId}`, {
    method: "GET",
    fallbackMessage: "게시글을 불러오지 못했습니다.",
  });
}
