package com.example.findAnswer.mentorbridge.handler;

import com.example.findAnswer.mentorbridge.constants.ErrorCode;
import com.example.findAnswer.mentorbridge.dto.error.ErrorResponse;
import com.example.findAnswer.mentorbridge.exception.CustomException;
import com.example.findAnswer.mentorbridge.exception.UnsupportedFileTypeException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.nio.file.AccessDeniedException;
import java.util.Map;

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

    @ExceptionHandler(UnsupportedFileTypeException.class)
    public ResponseEntity<ErrorResponse> handleUnsupportedFileTypeException(UnsupportedFileTypeException e) {
        ErrorResponse response = new ErrorResponse(ErrorCode.VALIDATION_ERROR.name(), e.getMessage(), null);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, String>> handleAccessDeniedException(AccessDeniedException e) {
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(Map.of(
                        "errorCode", "SUBSCRIPTION_REQUIRED",
                        "message", e.getMessage()
                ));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgumentException(IllegalArgumentException e) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(Map.of(
                        "errorCode", "INVALID_INPUT",
                        "message", e.getMessage()
                ));
    }
}