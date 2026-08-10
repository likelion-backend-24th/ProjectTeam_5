package com.example.findAnswer.mentorbridge.factory;

import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
public class RefreshTokenCookieFactory {

    private static final String NAME = "refreshToken";
    private static final String PATH = "/api/auth";
    private static final Duration TIMEOUT = Duration.ofDays(14);

    private final boolean secure = true;
    private final String sameSite = "None";




}