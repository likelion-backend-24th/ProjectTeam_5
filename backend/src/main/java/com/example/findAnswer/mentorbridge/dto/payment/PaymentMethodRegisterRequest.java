package com.example.findAnswer.mentorbridge.dto.payment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record PaymentMethodRegisterRequest(

        @NotBlank(message = "카드 별명은 필수입니다.")
        String cardNickname,
        @NotBlank(message = "카드 브랜드는 필수입니다.")
        String brand,
        @NotBlank(message = "마지막 4자리는 필수입니다.")
        @Pattern(message = "마지막 4자리는 숫자이어야 합니다.", regexp = "\\d4")
        String last4
) {
}
