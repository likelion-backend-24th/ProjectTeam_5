package com.example.findAnswer.mentorbridge.controller;

import com.example.findAnswer.mentorbridge.dto.billing.BillingKeyPrepareResponse;
import com.example.findAnswer.mentorbridge.dto.payment.PaymentMethodRegisterRequest;
import com.example.findAnswer.mentorbridge.dto.payment.PaymentMethodResponse;
import com.example.findAnswer.mentorbridge.service.PaymentMethodService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/payment-methods")
public class PaymentMethodController {

    private final PaymentMethodService paymentMethodService;

    // 빌링키 발급 준비 (POST /api/payment-methods/prepare) → 200 OK
    @PostMapping("/prepare")
    public ResponseEntity<BillingKeyPrepareResponse> prepareBillingKeyIssuance(
            @AuthenticationPrincipal Long currentUserId
    ) {
        return ResponseEntity.ok(paymentMethodService.prepareBillingKeyIssuance(currentUserId));
    }

    // POST /api/payment-methods → 201 Created
    @PostMapping
    public ResponseEntity<PaymentMethodResponse> registerPaymentMethod(
            @AuthenticationPrincipal Long currentUserId,
            @Valid
            @RequestBody PaymentMethodRegisterRequest request
    ){
        PaymentMethodResponse paymentMethodResponse = paymentMethodService.registerPaymentMethod(currentUserId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(paymentMethodResponse);
    }

    // GET /api/payment-methods → 200 OK
    @GetMapping
    public ResponseEntity<List<PaymentMethodResponse>> getPaymentMethod(@AuthenticationPrincipal Long currentUserId) {
        return ResponseEntity.ok(paymentMethodService.getPaymentMethods(currentUserId));
    }


    @PatchMapping("/{id}/default")
    public ResponseEntity<PaymentMethodResponse> updateDefaultPaymentMethod(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long id
    ){
        return ResponseEntity.ok(paymentMethodService.setDefaultPaymentMethod(currentUserId, id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePaymentMethod(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long id
    ) {
        paymentMethodService.deletePaymentMethod(currentUserId, id);
        return ResponseEntity.noContent().build();
    }

}
