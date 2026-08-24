package com.example.findAnswer.mentorbridge.controller;

import com.example.findAnswer.mentorbridge.dto.settlement.SettlementResponse;
import com.example.findAnswer.mentorbridge.service.SettlementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/settlements")
@RequiredArgsConstructor
public class SettlementController {

    private final SettlementService settlementService;

    @GetMapping("/me")
    public ResponseEntity<List<SettlementResponse>> getMySettlements(@AuthenticationPrincipal Long currentUserId) {
        return ResponseEntity.ok(settlementService.getMySettlements(currentUserId));
    }
}