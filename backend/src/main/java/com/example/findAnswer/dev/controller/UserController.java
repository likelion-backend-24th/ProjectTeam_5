package com.example.findAnswer.dev.controller;

import com.example.findAnswer.dev.dto.user.UserEmailUpdateRequest;
import com.example.findAnswer.dev.dto.user.UserPasswordUpdateRequest;
import com.example.findAnswer.dev.dto.user.UserProfileUpdateRequest;
import com.example.findAnswer.dev.dto.user.UserResponse;
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
            throw new IllegalStateException("본인의 계정만 수정 또는 삭제할 수 있습니다.");
        }
    }
}
