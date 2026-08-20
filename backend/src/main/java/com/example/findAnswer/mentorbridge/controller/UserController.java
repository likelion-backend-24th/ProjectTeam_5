package com.example.findAnswer.mentorbridge.controller;

import com.example.findAnswer.mentorbridge.dto.mentor.MentorApplicationResponse;
import com.example.findAnswer.mentorbridge.dto.user.*;
import com.example.findAnswer.mentorbridge.service.MentorService;
import com.example.findAnswer.mentorbridge.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final MentorService mentorService;

    //프로필 조회 (GET /api/users/me) - 200 OK
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getProfile(@AuthenticationPrincipal Long userId) {
        UserResponse response = userService.getUserProfile(userId);
        return ResponseEntity.ok(response);
    }

    // 전체 회원 목록 조회 (공개) — 탈퇴한 계정은 제외
    @GetMapping
    public ResponseEntity<List<UserResponse>> getUsers() {
        List<UserResponse> responses = userService.getActiveUsers();
        return ResponseEntity.ok(responses);
    }

    //프로필(이름) 수정 (PATCH /api/users/me) - 200 OK
    @PatchMapping("/me")
    public ResponseEntity<UserResponse> updateProfile(@AuthenticationPrincipal Long userId,
                                                      @Valid @RequestBody UserProfileUpdateRequest request) {
        UserResponse response = userService.updateProfile(userId, request);
        return ResponseEntity.ok(response);
    }

    //이메일 수정 (PATCH /api/users/me/email) - 200 OK
    @PatchMapping("/me/email")
    public ResponseEntity<UserResponse> updateEmail(@Valid @RequestBody UserEmailUpdateRequest request,
                                                    @AuthenticationPrincipal Long userId) {
        UserResponse response = userService.updateEmail(userId, request);
        return ResponseEntity.ok(response);
    }

    //비밀번호 수정 (PATCH /api/users/me/password) - 200 OK
    @PatchMapping("/me/password")
    public ResponseEntity<Void> updatePassword(@Valid @RequestBody UserPasswordUpdateRequest request,
                                               @AuthenticationPrincipal Long userId) {
        userService.updatePassword(userId, request);
        return ResponseEntity.ok().build();
    }

    //회원 탈퇴/삭제 (DELETE /api/users/me) - 204 No Content
    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteUser(@AuthenticationPrincipal Long userId) {
        userService.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }

    //멘토 신청
    @PostMapping("/me/mentor/application")
    public ResponseEntity<Void> applyForMentor(@AuthenticationPrincipal Long userId) {
        mentorService.applyForMentor(userId);
        return ResponseEntity.ok().build();
    }

    //내 멘토 신청 상태 조회
    @GetMapping("/me/mentor/application")
    public ResponseEntity<MentorApplicationResponse> getMyMentorApplication(@AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(mentorService.getMyMentorApplication(userId));
    }

    // 특정 유저의 공개 프로필 조회 (누구나 볼 수 있어야 함)
    @GetMapping("/{userId}")
    public ResponseEntity<UserResponse> getPublicProfile(
            @PathVariable Long userId,
            @AuthenticationPrincipal Long currentUserId) {
        return ResponseEntity.ok(userService.getPublicProfile(userId, currentUserId));
    }

    // 공개 프로필 텍스트 정보 업데이트
    @PatchMapping("/me/public-profile")
    public ResponseEntity<UserResponse> updatePublicProfile(
            @AuthenticationPrincipal Long userId,
            @RequestBody PublicProfileUpdateRequest request) {
        return ResponseEntity.ok(userService.updatePublicProfile(userId, request));
    }

    // 프로필 이미지 URL 업데이트
    @PatchMapping("/me/profile-image")
    public ResponseEntity<UserResponse> updateProfileImage(
            @AuthenticationPrincipal Long userId,
            @RequestBody ProfileImageUpdateRequest request) {
        return ResponseEntity.ok(userService.updateProfileImage(userId, request));
    }

    //팔로우/언팔로우 API
    @PostMapping("/{userId}/follow")
    public ResponseEntity<Void> toggleFollow(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long userId) {
        userService.toggleFollow(currentUserId, userId);
        return ResponseEntity.ok().build();
    }

    //이메일 인증 발송 API
    @PostMapping("/me/email/verification-code")
    public ResponseEntity<Void> sendVerificationCode(
            @AuthenticationPrincipal Long userId,
            @RequestBody EmailVerificationRequest request) {
        userService.sendVerificationCode(userId, request);
        return ResponseEntity.ok().build();
    }

    //이메일 인증 확인 API
    @PostMapping("/me/email/verify")
    public ResponseEntity<UserResponse> verifyEmailCode(
            @AuthenticationPrincipal Long userId,
            @RequestBody EmailVerificationSubmitRequest request) {
        UserResponse response = userService.verifyEmailCode(userId, request);
        return ResponseEntity.ok(response);
    }
}
