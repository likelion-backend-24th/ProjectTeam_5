package com.example.findAnswer.mentorbridge.controller;

import com.example.findAnswer.mentorbridge.dto.inquiry.InquiryRequestDto;
import com.example.findAnswer.mentorbridge.entity.Inquiry;
import com.example.findAnswer.mentorbridge.service.InquiryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/inquiries")
@RequiredArgsConstructor
public class InquiryController {

    private final InquiryService inquiryService;

    //문의 등록
    @PostMapping
    public ResponseEntity<Void> createInquiry(@RequestBody InquiryRequestDto requestDto) {
        inquiryService.createInquiry(requestDto);
        return ResponseEntity.ok().build();
    }

    //관리자용 문의 목록 조회
    @GetMapping
    public ResponseEntity<List<Inquiry>> getAllInquiries() {
        List<Inquiry> inquiries = inquiryService.getAllInquiries();
        return ResponseEntity.ok(inquiries);
    }

    //관리자용 문의 상태 변경 API
    @PatchMapping("/{id}/status")
    public ResponseEntity<Void> updateInquiryStatus(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> requestBody
    ) {
        String status = requestBody.get("status");
        inquiryService.updateInquiryStatus(id, status);
        return ResponseEntity.ok().build();
    }
}