package com.example.findAnswer.mentorbridge.dto.payment;

import jakarta.validation.constraints.NotBlank;

public record PaymentMethodRegisterRequest(

        @NotBlank(message = "카드 별명은 필수입니다.")
        String cardNickname,
        // /prepare에서 서버가 발급해준 issueId — 이 요청의 소유자 확인에 쓰인다.
        @NotBlank(message = "issueId는 필수입니다.")
        String issueId,
        // PortOne requestIssueBillingKey() 응답으로 프론트가 받은 실제 빌링키. 서버가 이 값을 PortOne에 재조회해 검증한다.
        @NotBlank(message = "billingKey는 필수입니다.")
        String billingKey
) {
}
