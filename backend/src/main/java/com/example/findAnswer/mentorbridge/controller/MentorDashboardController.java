package com.example.findAnswer.mentorbridge.controller;

import com.example.findAnswer.mentorbridge.dto.mentor.MentorDashboardSummaryResponse;
import com.example.findAnswer.mentorbridge.dto.mentor.MentorPaymentResponse;
import com.example.findAnswer.mentorbridge.dto.mentor.MentorSubscriberResponse;
import com.example.findAnswer.mentorbridge.dto.payment.PaymentCancellationResponse;
import com.example.findAnswer.mentorbridge.service.MentorDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// 멘토 대시보드 — 전부 "나(로그인한 멘토)" 기준 조회라 mentorId를 경로에 안 받고 인증 정보에서 뽑는다.
@RestController
@RequestMapping("/api/mentors/me/dashboard")
@RequiredArgsConstructor
public class MentorDashboardController {

    private final MentorDashboardService mentorDashboardService;

    @GetMapping("/summary")
    public ResponseEntity<MentorDashboardSummaryResponse> getSummary(@AuthenticationPrincipal Long currentUserId) {
        return ResponseEntity.ok(mentorDashboardService.getSummary(currentUserId));
    }

    @GetMapping("/subscribers")
    public ResponseEntity<List<MentorSubscriberResponse>> getSubscribers(@AuthenticationPrincipal Long currentUserId) {
        return ResponseEntity.ok(mentorDashboardService.getSubscribers(currentUserId));
    }

    @GetMapping("/refunds")
    public ResponseEntity<List<PaymentCancellationResponse>> getPendingRefunds(@AuthenticationPrincipal Long currentUserId) {
        return ResponseEntity.ok(mentorDashboardService.getPendingRefunds(currentUserId));
    }

    @GetMapping("/payments")
    public ResponseEntity<List<MentorPaymentResponse>> getPayments(@AuthenticationPrincipal Long currentUserId) {
        return ResponseEntity.ok(mentorDashboardService.getPayments(currentUserId));
    }
}
