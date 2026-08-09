package com.example.findAnswer.dev.exception;

import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;

public class OAuth2AuthException extends OAuth2AuthenticationException {
    public OAuth2AuthException(String message) {
        super(new OAuth2Error("oauth2_auth_error"), message);
    }
}