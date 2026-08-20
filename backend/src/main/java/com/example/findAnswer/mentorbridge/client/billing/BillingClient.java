package com.example.findAnswer.mentorbridge.client.billing;

import com.example.findAnswer.mentorbridge.dto.billing.BillingRegisterResult;

public interface BillingClient {
    // billingKey는 프론트가 PortOne SDK(requestIssueBillingKey)로부터 이미 발급받은 값.
    // 구현체는 이 값을 PortOne에 재조회해서 검증한 뒤 카드 정보를 채운 결과를 돌려줘야 한다 — 클라이언트가 보낸 카드 정보는 신뢰하지 않는다.
    BillingRegisterResult register(String billingKey);
}
