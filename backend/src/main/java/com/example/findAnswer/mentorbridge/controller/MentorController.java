package com.example.findAnswer.mentorbridge.controller;

import com.example.findAnswer.mentorbridge.dto.mentor.MentorResponse;
import com.example.findAnswer.mentorbridge.dto.mentor.MentorUpdateDto;
import com.example.findAnswer.mentorbridge.service.MentorService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/mentors")
@RequiredArgsConstructor
public class MentorController {

    private final MentorService mentorService;

    //멘토 목록 조회 및 검색 API
    @GetMapping
    public ResponseEntity<Page<MentorResponse>> getMentors(
            @RequestParam(required = false) String keyword, // 검색어 (이름, 소개, 태그)
            @PageableDefault(size = 8, sort = "createdAt") Pageable pageable // 기본 8개씩 최신순 페이징
    ) {
        Page<MentorResponse> response = mentorService.getMentors(keyword, pageable);
        return ResponseEntity.ok(response);
    }

    //멘토 상세 정보 단건 조회 API
    @GetMapping("/{mentorId}")
    public ResponseEntity<MentorResponse> getMentorDetail(@PathVariable Long mentorId) {
        MentorResponse response = mentorService.getMentorDetail(mentorId);
        return ResponseEntity.ok(response);
    }

    // 멘토 프로필 수정 API
    @PutMapping("/{mentorId}")
    public ResponseEntity<MentorResponse> updateMentorProfile(
            @PathVariable Long mentorId,
            @RequestBody MentorUpdateDto requestDto // 수정할 데이터를 받을 DTO
    ) {
        MentorResponse response = mentorService.updateMentorProfile(mentorId, requestDto);
        return ResponseEntity.ok(response);
    }
}