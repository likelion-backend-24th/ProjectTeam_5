import { request } from "./client";

// 빌링키 발급 준비 POST /api/payment-methods/prepare
// PortOne requestIssueBillingKey()를 호출할 때 그대로 넘길 storeId/channelKey/issueId를 받는다.
export function prepareBillingKeyIssuance() {
  return request("/api/payment-methods/prepare", {
    method: "POST",
    fallbackMessage: "카드 등록 준비에 실패했습니다.",
  });
}

// 결제수단 등록 POST /api/payment-methods
// 백엔드 PaymentMethodRegisterRequest: { cardNickname, issueId, billingKey }
// issueId/billingKey는 prepareBillingKeyIssuance() + requestIssueBillingKey() 결과로만 채운다.
export function registerPaymentMethod({ cardNickname, issueId, billingKey }) {
  return request("/api/payment-methods", {
    method: "POST",
    body: { cardNickname, issueId, billingKey },
    fallbackMessage: "결제수단 등록에 실패했습니다.",
  });
}

// 내 결제수단 목록 GET /api/payment-methods
export function getPaymentMethods() {
  return request("/api/payment-methods", {
    method: "GET",
    fallbackMessage: "결제수단 목록을 불러오지 못했습니다.",
  });
}

// 결제수단 삭제 DELETE /api/payment-methods/{id} (백엔드 204)
// ⚠️ 템플릿 리터럴은 반드시 백틱(`) — 큰따옴표로 쓰면 ${id}가 문자 그대로 나간다.
export function deletePaymentMethod(id) {
  return request(`/api/payment-methods/${id}`, {
    method: "DELETE",
    fallbackMessage: "결제수단 삭제에 실패했습니다.",
  });
}

// 대표 결제수단 지정 PATCH /api/payment-methods/{id}/default
// ⚠️ 백엔드가 @PatchMapping 이므로 method는 PATCH (기존 POST는 오류)
export function setDefaultPaymentMethod(id) {
  return request(`/api/payment-methods/${id}/default`, {
    method: "PATCH",
    fallbackMessage: "대표 결제수단 지정에 실패했습니다.",
  });
}
