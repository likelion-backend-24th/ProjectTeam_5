package com.example.findAnswer.mentorbridge.controller;

import com.example.findAnswer.mentorbridge.dto.subscription.SubscriptionCheckResponse;
import com.example.findAnswer.mentorbridge.dto.subscription.SubscriptionRequest;
import com.example.findAnswer.mentorbridge.dto.subscription.SubscriptionResponse;
import com.example.findAnswer.mentorbridge.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    // F-24: 구독 신청
    @PostMapping
    public ResponseEntity<SubscriptionResponse> subscribe(
            @RequestHeader("X-USER-ID") Long userId,
            @RequestBody SubscriptionRequest request) {

        SubscriptionResponse response = subscriptionService.subscribe(userId, request.mentorId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // F-24: 구독 해지 예약 (PATCH 방식 기존 유지)
    @PatchMapping("/{subscriptionId}/cancel")
    public ResponseEntity<Void> cancelSubscription(
            @RequestHeader("X-USER-ID") Long userId,
            @PathVariable Long subscriptionId) {

        subscriptionService.cancelSubscription(userId, subscriptionId);
        return ResponseEntity.ok().build();
    }

    // F-23: 구독 권한 단건 검증
    @GetMapping("/check")
    public ResponseEntity<SubscriptionCheckResponse> checkPermission(
            @RequestHeader("X-USER-ID") Long userId,
            @RequestParam Long mentorId) {

        return ResponseEntity.ok(subscriptionService.checkAccessPermission(userId, mentorId));
    }

    // F-28: 내 구독 상태 조회
    @GetMapping("/me")
    public ResponseEntity<List<SubscriptionResponse>> getMySubscriptions(
            @RequestHeader("X-USER-ID") Long userId) {

        return ResponseEntity.ok(subscriptionService.getMySubscriptions(userId));
    }
}