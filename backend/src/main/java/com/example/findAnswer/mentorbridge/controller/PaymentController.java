package com.example.findAnswer.mentorbridge.controller;

import com.example.findAnswer.mentorbridge.dto.payment.PaymentCancellationRequest;
import com.example.findAnswer.mentorbridge.dto.payment.PaymentCancellationResponse;
import com.example.findAnswer.mentorbridge.dto.payment.PaymentCompleteResponse;
import com.example.findAnswer.mentorbridge.service.PaymentCancellationService;
import com.example.findAnswer.mentorbridge.service.PaymentSyncService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentSyncService paymentSyncService;
    private final PaymentCancellationService paymentCancellationService;

    // 프론트가 PortOne 결제창 완료 직후 호출. 서버가 PortOne을 재조회해 최종 확정한다.
    @PostMapping("/{paymentId}/complete")
    public ResponseEntity<PaymentCompleteResponse> complete(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable String paymentId) {

        return ResponseEntity.ok(paymentSyncService.complete(paymentId, currentUserId));
    }

    // 환불 요청 — 관리자 승인이 있어야 실제로 취소·환불된다.
    @PostMapping("/{paymentId}/cancellations")
    public ResponseEntity<PaymentCancellationResponse> requestCancellation(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable String paymentId,
            @Valid @RequestBody PaymentCancellationRequest request) {

        PaymentCancellationResponse response =
                paymentCancellationService.requestCancellation(currentUserId, paymentId, request.reason());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // 내 환불 요청 이력
    @GetMapping("/cancellations/me")
    public ResponseEntity<List<PaymentCancellationResponse>> getMyCancellations(
            @AuthenticationPrincipal Long currentUserId) {
        return ResponseEntity.ok(paymentCancellationService.getMyCancellations(currentUserId));
    }
}
