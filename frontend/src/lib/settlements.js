import { request } from "./client";

// 내 정산 계좌 조회
export function getMySettlementAccount() {
    return request("/api/v1/settlement-accounts/me", {
        method: "GET",
        fallbackMessage: "정산 계좌 정보를 불러오지 못했습니다.",
    });
}

// 내 정산 계좌 등록 및 수정
export function saveOrUpdateSettlementAccount(data) {
    return request("/api/v1/settlement-accounts/me", {
        method: "POST",
        body: data,
        fallbackMessage: "정산 계좌 저장에 실패했습니다.",
    });
}