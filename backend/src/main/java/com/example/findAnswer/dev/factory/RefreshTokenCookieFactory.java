package com.example.findAnswer.dev.factory;

import lombok.Value;
import org.springframework.stereotype.Component;

import java.net.CookieManager;
import java.time.Duration;

@Component
public class RefreshTokenCookieFactory {

    private static final String NAME = "refreshToken";
    private static final String PATH = "/api/auth";
    private static final Duration TIMEOUT = Duration.ofDays(14);

    private final boolean secure = true;




}
