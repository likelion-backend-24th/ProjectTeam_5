package com.example.findAnswer.mentorbridge.controller;

import com.example.findAnswer.mentorbridge.dto.user.UserResponse;
import com.example.findAnswer.mentorbridge.service.MentorService;
import com.example.findAnswer.mentorbridge.service.UserService;
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
    private final UserService userService;

    // ================= 멘토 관리 =================

    // 멘토 신청 목록 조회 (GET /api/admin/mentors/applications)
    @GetMapping("/mentors/applications")
    public ResponseEntity<List<UserResponse>> getMentorApplications(@AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(mentorService.getMentorApplications(userId));
    }

    // 멘토 승인 (PATCH /api/admin/mentors/{userId}/approval)
    @PatchMapping("/mentors/{userId}/approval")
    public ResponseEntity<Void> approveMentor(@PathVariable Long userId) {
        mentorService.approveMentor(userId);
        return ResponseEntity.ok().build();
    }

    // 멘토 거절 (PATCH /api/admin/mentors/{userId}/rejection)
    @PatchMapping("/mentors/{userId}/rejection")
    public ResponseEntity<Void> rejectMentor(@PathVariable Long userId) {
        mentorService.rejectMentor(userId);
        return ResponseEntity.ok().build();
    }

    // ================= 회원 관리 =================

    // 전체 회원 목록 조회 (GET /api/admin/users)
    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    // 회원 차단 (PATCH /api/admin/users/{userId}/block)
    @PatchMapping("/users/{userId}/block")
    public ResponseEntity<Void> blockUser(@PathVariable Long userId) {
        userService.blockUser(userId);
        return ResponseEntity.ok().build();
    }

    // 회원 차단 해제 (PATCH /api/admin/users/{userId}/unblock)
    @PatchMapping("/users/{userId}/unblock")
    public ResponseEntity<Void> unblockUser(@PathVariable Long userId) {
        userService.unblockUser(userId);
        return ResponseEntity.ok().build();
    }

    // 회원 강제 탈퇴 (DELETE /api/admin/users/{userId}) — 소프트 삭제. DB 행은 남고 로그인만 차단된다.
    @DeleteMapping("/users/{userId}")
    public ResponseEntity<Void> deleteUserByAdmin(@PathVariable Long userId) {
        userService.deleteUser(userId);
        return ResponseEntity.ok().build();
    }
}