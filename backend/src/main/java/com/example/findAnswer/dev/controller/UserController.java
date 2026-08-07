package com.example.findAnswer.dev.controller;

import com.example.findAnswer.dev.dto.mentor.MentorApplicationResponse;
import com.example.findAnswer.dev.dto.user.UserEmailUpdateRequest;
import com.example.findAnswer.dev.dto.user.UserPasswordUpdateRequest;
import com.example.findAnswer.dev.dto.user.UserProfileUpdateRequest;
import com.example.findAnswer.dev.dto.user.UserResponse;
import com.example.findAnswer.dev.service.MentorService;
import com.example.findAnswer.dev.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

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
}
