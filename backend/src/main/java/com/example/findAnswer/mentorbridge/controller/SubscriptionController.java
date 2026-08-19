package com.example.findAnswer.mentorbridge.controller;

import com.example.findAnswer.mentorbridge.dto.payment.PaymentPrepareResponse;
import com.example.findAnswer.mentorbridge.dto.subscription.SubscriptionCheckResponse;
import com.example.findAnswer.mentorbridge.dto.subscription.SubscriptionRequest;
import com.example.findAnswer.mentorbridge.dto.subscription.SubscriptionResponse;
import com.example.findAnswer.mentorbridge.service.PaymentPrepareService;
import com.example.findAnswer.mentorbridge.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;
    private final PaymentPrepareService paymentPrepareService; // ★ 추가

    // F-24: 구독 신청 → 결제 준비 (기존: 바로 ACTIVE 생성 → 변경: Payment(READY) 발급)
    @PostMapping
    public ResponseEntity<PaymentPrepareResponse> subscribe(
            @RequestParam("planid") Long planId,
            @AuthenticationPrincipal Long currentUserId,       // ★ X-USER-ID → JWT
            @RequestBody SubscriptionRequest request) {

        PaymentPrepareResponse response = paymentPrepareService.prepare(currentUserId, request.mentorId(), planId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // F-24: 구독 해지 예약
    @PatchMapping("/{subscriptionId}/cancel")
    public ResponseEntity<Void> cancelSubscription(
            @AuthenticationPrincipal Long currentUserId,       // ★ X-USER-ID → JWT
            @PathVariable Long subscriptionId) {

        subscriptionService.cancelSubscription(currentUserId, subscriptionId);
        return ResponseEntity.ok().build();
    }

    // F-23: 구독 권한 단건 검증
    @GetMapping("/check")
    public ResponseEntity<SubscriptionCheckResponse> checkPermission(
            @AuthenticationPrincipal Long currentUserId,       // ★ X-USER-ID → JWT
            @RequestParam Long mentorId) {

        return ResponseEntity.ok(subscriptionService.checkAccessPermission(currentUserId, mentorId));
    }

    // F-28: 내 구독 상태 조회
    @GetMapping("/me")
    public ResponseEntity<List<SubscriptionResponse>> getMySubscriptions(
            @AuthenticationPrincipal Long currentUserId) {     // ★ X-USER-ID → JWT

        return ResponseEntity.ok(subscriptionService.getMySubscriptions(currentUserId));
    }
}
