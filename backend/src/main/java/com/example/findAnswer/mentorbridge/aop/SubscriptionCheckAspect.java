package com.example.findAnswer.mentorbridge.aop;

import com.example.findAnswer.mentorbridge.annotation.RequireSubscription;
import com.example.findAnswer.mentorbridge.dto.subscription.SubscriptionCheckResponse;
import com.example.findAnswer.mentorbridge.service.SubscriptionService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerMapping;

import java.util.Map;

@Aspect
@Component
@RequiredArgsConstructor
public class SubscriptionCheckAspect {

    private final SubscriptionService subscriptionService;
    private final HttpServletRequest request;

    @Before("@annotation(requireSubscription)")
    public void checkSubscription(RequireSubscription requireSubscription) {
        String userIdHeader = request.getHeader("X-USER-ID");
        if (userIdHeader == null) {
            throw new IllegalArgumentException("로그인 정보(X-USER-ID)가 존재하지 않습니다.");
        }
        Long userId = Long.parseLong(userIdHeader);

        String mentorIdStr = request.getParameter(requireSubscription.mentorIdParam());

        if (mentorIdStr == null) {
            @SuppressWarnings("unchecked")
            Map<String, String> pathVariables = (Map<String, String>) request.getAttribute(
                    HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE);
            if (pathVariables != null) {
                mentorIdStr = pathVariables.get(requireSubscription.mentorIdParam());
            }
        }

        if (mentorIdStr == null) {
            throw new IllegalArgumentException("멘토 ID(mentorId) 정보를 찾을 수 없습니다.");
        }

        Long mentorId = Long.parseLong(mentorIdStr);

        SubscriptionCheckResponse check = subscriptionService.checkAccessPermission(userId, mentorId);

        if (!check.accessAllowed()) {
            throw new AccessDeniedException("해당 멘토의 구독자만 이용할 수 있는 서비스입니다.");
        }
    }
}