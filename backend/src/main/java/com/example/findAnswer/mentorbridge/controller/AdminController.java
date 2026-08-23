package com.example.findAnswer.mentorbridge.controller;

import com.example.findAnswer.mentorbridge.constants.Role;
import com.example.findAnswer.mentorbridge.dto.payment.PaymentCancellationResponse;
import com.example.findAnswer.mentorbridge.dto.user.UserResponse;
import com.example.findAnswer.mentorbridge.service.MentorService;
import com.example.findAnswer.mentorbridge.service.PaymentCancellationService;
import com.example.findAnswer.mentorbridge.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

// SecurityConfig의 "/api/admin/**" -> hasRole("ADMIN") URL 매칭에만 기대지 않는다 — 새 엔드포인트가
// 실수로 그 패턴 밖(예: 오타)에 매핑돼도 여기서 한 번 더 막히도록 컨트롤러 레벨에도 걸어둔다.
@PreAuthorize("hasRole('ADMIN')")
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final MentorService mentorService;
    private final UserService userService;
    private final PaymentCancellationService paymentCancellationService;

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

    // 전체 회원 목록 조회 (GET /api/admin/users) — 질문 관리 탭의 작성자 집계용. 페이지네이션 없음.
    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    // 회원 관리 탭 전용 — 검색/역할 필터/정렬 + 페이지네이션
    // (GET /api/admin/users/search?page=&size=&keyword=&role=&sort=latest|oldest)
    @GetMapping("/users/search")
    public ResponseEntity<Page<UserResponse>> searchUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Role role,
            @RequestParam(defaultValue = "latest") String sort
    ) {
        Sort.Direction direction = "oldest".equals(sort) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, "id"));
        return ResponseEntity.ok(userService.searchUsersForAdmin(role, keyword, pageable));
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

    // 대기 중인 환불 요청 목록 (GET /api/admin/cancellations)
    @GetMapping("/cancellations")
    public ResponseEntity<List<PaymentCancellationResponse>> getPendingCancellations() {
        return ResponseEntity.ok(paymentCancellationService.getPendingCancellations());
    }

    // 환불 승인 — PortOne 취소 API를 실제로 호출한다 (PATCH /api/admin/cancellations/{id}/approve)
    @PatchMapping("/cancellations/{id}/approve")
    public ResponseEntity<Void> approveCancellation(@PathVariable Long id) {
        paymentCancellationService.approve(id);
        return ResponseEntity.ok().build();
    }

    // 환불 거절 (PATCH /api/admin/cancellations/{id}/reject)
    @PatchMapping("/cancellations/{id}/reject")
    public ResponseEntity<Void> rejectCancellation(@PathVariable Long id, @RequestBody Map<String, String> body) {
        paymentCancellationService.reject(id, body.get("adminNote"));
        return ResponseEntity.ok().build();
    }
}