package com.example.findAnswer.mentorbridge.controller;

import com.example.findAnswer.mentorbridge.dto.payment.PaymentCompleteResponse;
import com.example.findAnswer.mentorbridge.service.PaymentSyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentSyncService paymentSyncService;

    // 프론트가 PortOne 결제창 완료 직후 호출. 서버가 PortOne을 재조회해 최종 확정한다.
    @PostMapping("/{paymentId}/complete")
    public ResponseEntity<PaymentCompleteResponse> complete(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable String paymentId) {

        return ResponseEntity.ok(paymentSyncService.complete(paymentId, currentUserId));
    }
}
