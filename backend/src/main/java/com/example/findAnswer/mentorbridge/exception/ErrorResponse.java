package com.example.findAnswer.mentorbridge.exception;

import lombok.Getter;

@Getter
public class ErrorResponse {
    private final String code;
    private final String message;
    private final String field;

    public ErrorResponse(String code, String message, String field) {
        this.code = code;
        this.message = message;
        this.field = field;
    }
}