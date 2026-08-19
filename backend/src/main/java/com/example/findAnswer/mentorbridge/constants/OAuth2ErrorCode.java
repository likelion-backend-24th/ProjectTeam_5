package com.example.findAnswer.mentorbridge.constants;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum OAuth2ErrorCode {

    EMAIL_NOT_PROVIDED("oauth2_email_not_provided", "소셜 계정에서 이메일을 받지 못했습니다.", HttpStatus.BAD_REQUEST),
    EMAIL_NOT_VERIFIED("oauth2_email_not_verified", "이메일이 확인되지 않았습니다.", HttpStatus.BAD_REQUEST),
    UNSUPPORTED_PROVIDER("oauth2_unsupported_provider", "지원하지 않는 소셜 로그인입니다.", HttpStatus.BAD_REQUEST),
    PROVIDER_CONFLICT("oauth2_provider_conflict", "이미 다른 방식으로 가입된 이메일입니다.", HttpStatus.CONFLICT),
    WITHDRAWN_USER("oauth2_withdrawn_user", "탈퇴한 회원입니다.", HttpStatus.FORBIDDEN),
    USER_BLOCKED("oauth2_user_blocked", "차단된 계정입니다. 관리자에게 문의하세요.", HttpStatus.FORBIDDEN); // 🔥 추가

    private final String code;
    private final String message;
    private final HttpStatus status;
}