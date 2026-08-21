package com.example.findAnswer.mentorbridge.controller;

import com.example.findAnswer.mentorbridge.dto.Inquiry.InquiryRequestDto;
import com.example.findAnswer.mentorbridge.entity.Inquiry;
import com.example.findAnswer.mentorbridge.service.InquiryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class InquiryController {

    private final InquiryService inquiryService;

    // 1. 일반 사용자용 문의 등록
    @PostMapping("/api/v1/inquiries")
    public ResponseEntity<Void> createInquiry(@RequestBody InquiryRequestDto requestDto) {
        inquiryService.createInquiry(requestDto);
        return ResponseEntity.ok().build();
    }

    // 2. 관리자용 문의 목록 조회
    @GetMapping("/api/admin/inquiries")
    public ResponseEntity<List<Inquiry>> getAllInquiries() {
        List<Inquiry> inquiries = inquiryService.getAllInquiries();
        return ResponseEntity.ok(inquiries);
    }

    // 3. 관리자용 문의 상태 변경
    @PatchMapping("/api/admin/inquiries/{id}/status")
    public ResponseEntity<Void> updateInquiryStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> requestBody) {

        String status = requestBody.get("status");
        inquiryService.updateInquiryStatus(id, status);
        return ResponseEntity.ok().build();
    }
}