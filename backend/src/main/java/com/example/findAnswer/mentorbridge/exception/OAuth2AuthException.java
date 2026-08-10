package com.example.findAnswer.mentorbridge.exception;

import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;

public class OAuth2AuthException extends OAuth2AuthenticationException {
    public OAuth2AuthException(OAuth2ErrorCode message) {
        super(new OAuth2Error(message.getCode()), message.getMessage());
    }
}