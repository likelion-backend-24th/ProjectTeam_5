package com.example.findAnswer.mentorbridge.controller;

import com.example.findAnswer.mentorbridge.dto.settlement.SettlementAccountRequest;
import com.example.findAnswer.mentorbridge.dto.settlement.SettlementAccountResponse;
import com.example.findAnswer.mentorbridge.service.SettlementAccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/settlement-accounts")
@RequiredArgsConstructor
public class SettlementAccountController {

    private final SettlementAccountService settlementAccountService;

    // 내 정산 계좌 조회
    @GetMapping("/me")
    public ResponseEntity<SettlementAccountResponse> getMyAccount(@AuthenticationPrincipal Long currentUserId) {
        return ResponseEntity.ok(settlementAccountService.getMyAccount(currentUserId));
    }

    // 내 정산 계좌 등록 및 수정 (POST 하나로 퉁칩니다)
    @PostMapping("/me")
    public ResponseEntity<SettlementAccountResponse> saveOrUpdateAccount(
            @AuthenticationPrincipal Long currentUserId,
            @Valid @RequestBody SettlementAccountRequest request) {
        return ResponseEntity.ok(settlementAccountService.saveOrUpdateAccount(currentUserId, request));
    }
}