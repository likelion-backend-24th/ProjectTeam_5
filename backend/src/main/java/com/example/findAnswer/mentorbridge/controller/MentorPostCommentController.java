package com.example.findAnswer.mentorbridge.controller;

import com.example.findAnswer.mentorbridge.constants.ErrorCode;
import com.example.findAnswer.mentorbridge.dto.mentor.MentorPostCommentCreateRequest;
import com.example.findAnswer.mentorbridge.dto.mentor.MentorPostCommentResponse;
import com.example.findAnswer.mentorbridge.exception.CustomException;
import com.example.findAnswer.mentorbridge.service.MentorPostCommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 요청 주체는 전부 JWT(@AuthenticationPrincipal)에서 가져온다.
 * 이전에는 클라이언트가 보내는 X-USER-ID 헤더를 그대로 믿어서, 헤더 한 줄만 바꾸면
 * 다른 사용자 명의로 댓글을 쓰거나 지울 수 있었다(MentorPostController와 동일한 문제).
 */
@RestController
@RequestMapping("/api/v1/mentors/{mentorId}/posts/{postId}/comments")
@RequiredArgsConstructor
public class MentorPostCommentController {

    private final MentorPostCommentService mentorPostCommentService;

    @GetMapping
    public ResponseEntity<List<MentorPostCommentResponse>> getComments(
            @PathVariable Long mentorId,
            @PathVariable Long postId) {
        List<MentorPostCommentResponse> comments = mentorPostCommentService.getComments(postId);
        return ResponseEntity.ok(comments);
    }

    @PostMapping
    public ResponseEntity<MentorPostCommentResponse> createComment(
            @PathVariable Long mentorId,
            @PathVariable Long postId,
            @AuthenticationPrincipal Long currentUserId,
            @RequestBody MentorPostCommentCreateRequest request) {
        requireLogin(currentUserId);
        MentorPostCommentResponse response = mentorPostCommentService.createComment(postId, currentUserId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long mentorId,
            @PathVariable Long postId,
            @PathVariable Long commentId,
            @AuthenticationPrincipal Long currentUserId) {
        requireLogin(currentUserId);
        mentorPostCommentService.deleteComment(commentId, currentUserId);
        return ResponseEntity.noContent().build();
    }

    private void requireLogin(Long currentUserId) {
        if (currentUserId == null) {
            throw new CustomException(ErrorCode.AUTH_INVALID_CREDENTIALS);
        }
    }
}