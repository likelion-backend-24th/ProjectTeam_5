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
        if (exception instanceof OAuth2AuthenticationException oae) {
            OAuth2Error err = oae.getError();
            log.error("[OAuth2] error={}, desc={}, uri={}",
                    err.getErrorCode(), err.getDescription(), err.getUri());
            errorCode = err.getErrorCode();

            String errorDescription = request.getParameter("error_description");

            getRedirectStrategy().sendRedirect(request, response, failureRedirectUri + "?errorCode=" + errorCode + "&error=" + errorDescription);
        }

    }
}
