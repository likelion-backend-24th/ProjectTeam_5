package com.example.findAnswer.mentorbridge.controller;

import com.example.findAnswer.mentorbridge.dto.mentor.MentorResponse;
import com.example.findAnswer.mentorbridge.dto.mentor.MentorReviewRequest;
import com.example.findAnswer.mentorbridge.dto.mentor.MentorReviewResponse;
import com.example.findAnswer.mentorbridge.dto.mentor.MentorUpdateDto;
import com.example.findAnswer.mentorbridge.service.MentorReviewService;
import com.example.findAnswer.mentorbridge.service.MentorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mentors")
@RequiredArgsConstructor
public class MentorController {

    private final MentorService mentorService;
    private final MentorReviewService mentorReviewService;

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

    // 멘토 프로필 수정 API — 본인 프로필만 수정 가능
    @PutMapping("/{mentorId}")
    public ResponseEntity<MentorResponse> updateMentorProfile(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long mentorId,
            @RequestBody MentorUpdateDto requestDto // 수정할 데이터를 받을 DTO
    ) {
        MentorResponse response = mentorService.updateMentorProfile(currentUserId, mentorId, requestDto);
        return ResponseEntity.ok(response);
    }

    // 멘토 리뷰 목록 조회
    @GetMapping("/{mentorId}/reviews")
    public ResponseEntity<List<MentorReviewResponse>> getReviews(@PathVariable Long mentorId) {
        return ResponseEntity.ok(mentorReviewService.getReviews(mentorId));
    }

    // 리뷰 작성/수정 — 이 멘토를 구독한 적 있는 유저만 가능. 이미 남긴 리뷰가 있으면 덮어쓴다.
    @PostMapping("/{mentorId}/reviews")
    public ResponseEntity<MentorReviewResponse> createOrUpdateReview(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long mentorId,
            @Valid @RequestBody MentorReviewRequest request) {
        MentorReviewResponse response = mentorReviewService.createOrUpdateReview(currentUserId, mentorId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // 리뷰 삭제 — 본인 리뷰만 가능
    @DeleteMapping("/{mentorId}/reviews/{reviewId}")
    public ResponseEntity<Void> deleteReview(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long mentorId,
            @PathVariable Long reviewId) {
        mentorReviewService.deleteReview(currentUserId, reviewId);
        return ResponseEntity.noContent().build();
    }
}