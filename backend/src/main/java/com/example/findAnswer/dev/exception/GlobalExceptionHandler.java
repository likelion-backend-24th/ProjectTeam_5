package com.example.findAnswer.dev.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(CustomException.class)
    public ResponseEntity<ErrorResponse> handleCustomException(CustomException e) {
        ErrorCode errorCode = e.getErrorCode();
        ErrorResponse response = new ErrorResponse(errorCode.name(), errorCode.getMessage(), null);
        return ResponseEntity.status(errorCode.getStatus()).body(response);
    }

    //@Valid 검증 실패 시에도 팀 공통 에러 포맷으로 응답
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(MethodArgumentNotValidException e) {
        FieldError fieldError = e.getBindingResult().getFieldError();
        String field = fieldError != null ? fieldError.getField() : null;
        String message = fieldError != null ? fieldError.getDefaultMessage() : "입력값이 올바르지 않습니다.";
        ErrorResponse response = new ErrorResponse(ErrorCode.VALIDATION_ERROR.name(), message, field);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }
}