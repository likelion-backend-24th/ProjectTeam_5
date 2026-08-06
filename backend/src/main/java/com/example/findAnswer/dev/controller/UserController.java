package com.example.findAnswer.dev.controller;

import com.example.findAnswer.dev.dto.user.UserEmailUpdateRequest;
import com.example.findAnswer.dev.dto.user.UserPasswordUpdateRequest;
import com.example.findAnswer.dev.dto.user.UserProfileUpdateRequest;
import com.example.findAnswer.dev.dto.user.UserResponse;
import com.example.findAnswer.dev.exception.CustomException;
import com.example.findAnswer.dev.exception.ErrorCode;
import com.example.findAnswer.dev.service.UserService;
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

    //프로필 조회 (GET /api/users/{userId}) - 200 OK
    @GetMapping("/{userId}")
    public ResponseEntity<UserResponse> getProfile(@PathVariable Long userId) {
        UserResponse response = userService.getUserProfile(userId);
        return ResponseEntity.ok(response);
    }

    //프로필(이름) 수정 (PUT /api/users/{userId}) - 200 OK
    @PutMapping("/{userId}")
    public ResponseEntity<UserResponse> updateProfile(@PathVariable Long userId,
                                                      @Valid @RequestBody UserProfileUpdateRequest request,
                                                      @AuthenticationPrincipal Long currentUserId) {
        validateOwner(userId, currentUserId);
        UserResponse response = userService.updateProfile(userId, request);
        return ResponseEntity.ok(response);
    }

    //이메일 수정 (PUT /api/users/{userId}/email) - 200 OK
    @PutMapping("/{userId}/email")
    public ResponseEntity<UserResponse> updateEmail(@PathVariable Long userId,
                                                    @Valid @RequestBody UserEmailUpdateRequest request,
                                                    @AuthenticationPrincipal Long currentUserId) {
        validateOwner(userId, currentUserId);
        UserResponse response = userService.updateEmail(userId, request);
        return ResponseEntity.ok(response);
    }

    //비밀번호 수정 (PUT /api/users/{userId}/password) - 200 OK
    @PutMapping("/{userId}/password")
    public ResponseEntity<Void> updatePassword(@PathVariable Long userId,
                                               @Valid @RequestBody UserPasswordUpdateRequest request,
                                               @AuthenticationPrincipal Long currentUserId) {
        validateOwner(userId, currentUserId);
        userService.updatePassword(userId, request);
        return ResponseEntity.ok().build();
    }

    //회원 탈퇴/삭제 (DELETE /api/users/{userId}) - 204 No Content
    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long userId,
                                           @AuthenticationPrincipal Long currentUserId) {
        validateOwner(userId, currentUserId);
        userService.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }

    //타인의 회원 정보를 수정하거나 삭제하지 못하도록 차단
    private void validateOwner(Long targetUserId, Long currentUserId) {
        if (!targetUserId.equals(currentUserId)) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }
    }

    //멘토 신청 (PUT /api/users/{userId}/mentor-application) - 200 OK
    @PutMapping("/{userId}/mentor-application")
    public ResponseEntity<Void> applyForMentor(@PathVariable Long userId,
                                               @AuthenticationPrincipal Long currentUserId) {
        validateOwner(userId, currentUserId);
        userService.applyForMentor(userId);
        return ResponseEntity.ok().build();
    }

    //멘토 신청 목록 조회 (GET /api/users/mentor-applications) - 200 OK
    @GetMapping("/mentor-applications")
    public ResponseEntity<List<UserResponse>> getMentorApplications() {
        return ResponseEntity.ok(userService.getMentorApplications());
    }

    //멘토 승인 (PUT /api/users/{userId}/mentor-approval) - 200 OK
    @PutMapping("/{userId}/mentor-approval")
    public ResponseEntity<Void> approveMentor(@PathVariable Long userId) {
        userService.approveMentor(userId);
        return ResponseEntity.ok().build();
    }

    //멘토 거절 (PUT /api/users/{userId}/mentor-rejection) - 200 OK
    @PutMapping("/{userId}/mentor-rejection")
    public ResponseEntity<Void> rejectMentor(@PathVariable Long userId) {
        userService.rejectMentor(userId);
        return ResponseEntity.ok().build();
    }
}
