package com.example.findAnswer.mentorbridge.handler;

import com.example.findAnswer.mentorbridge.dto.oauth.CustomOAuth2User;
import com.example.findAnswer.mentorbridge.dto.user.TokenResponse;
import com.example.findAnswer.mentorbridge.service.RefreshTokenService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Objects;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final RefreshTokenService refreshTokenService;

    @Value("${app.oauth2.success-redirect-uri}")
    private String successRedirectUri;

    @Override
    public void onAuthenticationSuccess(@NonNull HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        CustomOAuth2User  principal = (CustomOAuth2User) authentication.getPrincipal();

        TokenResponse tokenResponse = refreshTokenService.issueTokens(Objects.requireNonNull(principal).userId(), principal.email(), principal.role());

        ResponseCookie cookie = ResponseCookie.from("refreshToken", tokenResponse.getRefreshToken())
                .httpOnly(true)
                .secure(true)
                .sameSite("None")
                .path("/api/auth")
                .maxAge(Duration.ofDays(14))
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        // accessToken은 URL로 넘기지 않는다 — 브라우저 히스토리/서버 접근 로그/Referer에 남을 수 있다.
        // 프론트가 이 리다이렉트를 받은 직후 위에서 심어둔 refreshToken 쿠키로 /api/auth/refresh를 불러
        // accessToken을 받아간다(OAuthCallbackClient.jsx의 restoreSession 참고).
        String target = UriComponentsBuilder.fromUriString(successRedirectUri)
                .build().encode(StandardCharsets.UTF_8).toUriString();

        clearAuthenticationAttributes(request);
        getRedirectStrategy().sendRedirect(request, response, target);
    }
}
