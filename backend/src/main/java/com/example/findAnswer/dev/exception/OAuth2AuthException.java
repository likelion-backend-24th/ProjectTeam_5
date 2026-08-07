package com.example.findAnswer.dev.exception;

import org.springframework.security.oauth2.core.OAuth2AuthenticationException;

public class OAuth2AuthException extends OAuth2AuthenticationException {
    public OAuth2AuthException(String message) {
        super(message);
    }
}
