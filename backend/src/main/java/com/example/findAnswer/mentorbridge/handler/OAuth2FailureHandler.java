package com.example.findAnswer.mentorbridge.handler;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
@Slf4j
public class OAuth2FailureHandler extends SimpleUrlAuthenticationFailureHandler {

    @Value("${app.oauth2.failure-redirect-uri}")
    private String failureRedirectUri;


    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response, org.springframework.security.core.AuthenticationException exception) throws IOException, ServletException {

        log.error("[OAuth2] 로그인 실패: type={}, msg={}",
                exception.getClass().getName(), exception.getMessage(), exception);

        String errorCode = "oauth2_auth_error";
        String errorDescription = exception.getMessage();   // 기본값 예외 메시지

        if (exception instanceof OAuth2AuthenticationException oae) {
            OAuth2Error err = oae.getError();
            log.error("[OAuth2] error={}, desc={}, uri={}",
                    err.getErrorCode(), err.getDescription(), err.getUri());
            errorCode = err.getErrorCode();
            if (err.getDescription() != null) {
                errorDescription = err.getDescription();    // 예외 메시지(차단)
            }
        }

        if (errorDescription == null) {
            errorDescription = "로그인에 실패했습니다.";
        }

        // URL 인코딩
        String redirectUri = failureRedirectUri
                + "?errorCode=" + URLEncoder.encode(errorCode, StandardCharsets.UTF_8)
                + "&error=" + URLEncoder.encode(errorDescription, StandardCharsets.UTF_8);

        // OAuth2AuthenticationException 이 아닌 실패도 리다이렉트
        getRedirectStrategy().sendRedirect(request, response, redirectUri);
    }
}
