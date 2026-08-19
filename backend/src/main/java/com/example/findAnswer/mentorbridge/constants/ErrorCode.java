package com.example.findAnswer.mentorbridge.constants;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
    VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다."),
    EMAIL_DUPLICATE(HttpStatus.CONFLICT, "이미 가입된 이메일입니다."),
    AUTH_INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 일치하지 않습니다."),
    AUTH_REFRESH_INVALID(HttpStatus.UNAUTHORIZED, "refreshToken이 유효하지 않습니다."),
    RESOURCE_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 리소스입니다."),
    USER_NOT_FOUND(HttpStatus.NOT_FOUND,"존재하지 않는 사용자입니다."),
    QUESTION_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 질문입니다."),
    ANSWER_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 답변입니다."),
    ACCESS_DENIED(HttpStatus.FORBIDDEN, "접근 권한이 없습니다."),
    FILE_TOO_LARGE(HttpStatus.BAD_REQUEST, "파일이 너무 큽니다."),
    INVALID_REQUEST(HttpStatus.BAD_REQUEST, "잘못된 요청입니다."),
    USER_BLOCKED(HttpStatus.FORBIDDEN, "차단된 계정입니다. 관리자에게 문의하세요."),
    FILE_STORAGE_ERROR(HttpStatus.BAD_REQUEST, "파일 저장소 설정이 잘못되었습니다."),
    FILE_NOT_FOUND(HttpStatus.NOT_FOUND, "파일을 찾을 수 없습니다."),
    PAYMENT_METHOD_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 결제수단입니다."),
    PLAN_NOT_FOUND(HttpStatus.NOT_FOUND, "구독 플랜을 찾을 수 없습니다."),
    MENTOR_PLAN_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 요금제입니다."),
    SUBSCRIPTION_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 구독입니다."),
    PAYMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 결제입니다."),
    ALREADY_SUBSCRIBED(HttpStatus.CONFLICT, "이미 진행 중인 구독이 존재합니다."),
    PAYMENT_VERIFICATION_FAILED(HttpStatus.BAD_REQUEST, "결제 검증에 실패했습니다.");


    private final HttpStatus status;
    private final String message;

    ErrorCode(HttpStatus status, String message) {
        this.status = status;
        this.message = message;
    }

    public HttpStatus getStatus() { return status; }
    public String getMessage() { return message; }
}