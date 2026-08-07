package com.example.findAnswer.dev.controller;

import com.example.findAnswer.dev.dto.user.UserResponse;
import com.example.findAnswer.dev.service.MentorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {
    private final MentorService mentorService;


    //멘토 신청 목록 조회 (GET /api/auth/mentor-applications) - 200 OK
    @GetMapping("/mentor/applications")
    public ResponseEntity<List<UserResponse>> getMentorApplications(@AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(mentorService.getMentorApplications(userId));
    }

    //멘토 승인 (PATCH /api/auth/{userId}/mentor-approval) - 200 OK
    @PatchMapping("/{userId}/mentors/approval")
    public ResponseEntity<Void> approveMentor(@PathVariable Long userId) {
        mentorService.approveMentor(userId);
        return ResponseEntity.ok().build();
    }

    //멘토 거절 (PATCH /api/auth/{userId}/mentor-rejection) - 200 OK
    @PatchMapping("/{userId}/mentors/rejection")
    public ResponseEntity<Void> rejectMentor(@PathVariable Long userId) {
        mentorService.rejectMentor(userId);
        return ResponseEntity.ok().build();
    }

}
