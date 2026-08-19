package com.example.findAnswer.mentorbridge.controller;

import com.example.findAnswer.mentorbridge.constants.ErrorCode;
import com.example.findAnswer.mentorbridge.dto.mentorPlan.MentorPlanRequest;
import com.example.findAnswer.mentorbridge.dto.mentorPlan.MentorPlanResponse;
import com.example.findAnswer.mentorbridge.exception.CustomException;
import com.example.findAnswer.mentorbridge.service.MentorPlanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/mentors/{mentorId}/plans")
@RequiredArgsConstructor
public class MentorPlanController {

    private final MentorPlanService mentorPlanService;

    // 요금제 목록 조회
    @GetMapping
    public ResponseEntity<List<MentorPlanResponse>> getPlans(@PathVariable Long mentorId) {
        return ResponseEntity.ok(mentorPlanService.getMentorPlanByMentor(mentorId));
    }

    // 요금제 단건 조회
    @GetMapping("/{planId}")
    public ResponseEntity<MentorPlanResponse> getPlan(
            @PathVariable Long mentorId,
            @PathVariable Long planId) {
        return ResponseEntity.ok(mentorPlanService.getMentorPlanById(planId));
    }

    // 요금제 등록 — 멘토 본인만
    @PostMapping
    public ResponseEntity<MentorPlanResponse> createPlan(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long mentorId,
            @Valid @RequestBody MentorPlanRequest request) {

        requireSelf(currentUserId, mentorId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(mentorPlanService.createMentorPlan(mentorId, request));
    }

    // 요금제 수정 — 멘토 본인만
    @PutMapping("/{planId}")
    public ResponseEntity<MentorPlanResponse> updatePlan(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long mentorId,
            @PathVariable Long planId,
            @Valid @RequestBody MentorPlanRequest request) {

        requireSelf(currentUserId, mentorId);
        return ResponseEntity.ok(mentorPlanService.updateMentorPlan(mentorId, planId, request));
    }

    // 요금제 삭제(비활성화) — 멘토 본인만
    @DeleteMapping("/{planId}")
    public ResponseEntity<Void> deletePlan(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long mentorId,
            @PathVariable Long planId) {

        requireSelf(currentUserId, mentorId);
        mentorPlanService.deleteMentorPlanById(mentorId, planId);
        return ResponseEntity.noContent().build();
    }

    private void requireSelf(Long currentUserId, Long mentorId) {
        if (!currentUserId.equals(mentorId)) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }
    }
}
