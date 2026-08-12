package com.example.findAnswer.mentorbridge.exception;

import com.example.findAnswer.mentorbridge.constants.OAuth2ErrorCode;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;

public class OAuth2AuthException extends OAuth2AuthenticationException {
    public OAuth2AuthException(OAuth2ErrorCode errorCode) {
        // OAuth2Error 에 description 까지 담아, 실패 핸들러가 err.getDescription()으로 메시지를 꺼낼 수 있게 한다.
        super(new OAuth2Error(errorCode.getCode(), errorCode.getMessage(), null), errorCode.getMessage());
    }
}