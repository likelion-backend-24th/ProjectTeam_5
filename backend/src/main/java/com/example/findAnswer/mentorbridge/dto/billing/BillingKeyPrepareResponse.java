package com.example.findAnswer.mentorbridge.dto.billing;

// 프론트가 PortOne Browser SDK의 requestIssueBillingKey()를 호출할 때 그대로 넘길 값들
public record BillingKeyPrepareResponse(
        String storeId,
        String channelKey,
        String issueId
) {
}
