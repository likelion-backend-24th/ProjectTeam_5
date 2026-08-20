package com.example.findAnswer.mentorbridge.controller;

import com.example.findAnswer.mentorbridge.dto.payment.PaymentCompleteResponse;
import com.example.findAnswer.mentorbridge.dto.payment.PaymentHistoryResponse;
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

    // F-24: 구독 신청 — 등록된 카드로 서버가 즉시 청구하고 결과까지 반환(결제창 팝업 없음)
    @PostMapping
    public ResponseEntity<PaymentCompleteResponse> subscribe(
            @RequestParam("planid") Long planId,
            @AuthenticationPrincipal Long currentUserId,       // ★ X-USER-ID → JWT
            @RequestBody SubscriptionRequest request) {

        PaymentCompleteResponse response = paymentPrepareService.subscribe(currentUserId, request.mentorId(), planId);
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

    // 구독 관리 화면 — 결제 이력(환불 요청 대상 선택용)
    @GetMapping("/{subscriptionId}/payments")
    public ResponseEntity<List<PaymentHistoryResponse>> getPaymentHistory(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long subscriptionId) {

        return ResponseEntity.ok(subscriptionService.getPaymentHistory(currentUserId, subscriptionId));
    }
}
