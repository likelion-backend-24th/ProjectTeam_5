package com.example.findAnswer.mentorbridge.controller;

import com.example.findAnswer.mentorbridge.constants.ErrorCode;
import com.example.findAnswer.mentorbridge.dto.mentor.MentorPostRequest;
import com.example.findAnswer.mentorbridge.dto.mentor.MentorPostResponse;
import com.example.findAnswer.mentorbridge.exception.CustomException;
import com.example.findAnswer.mentorbridge.service.MentorPostService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 요청 주체는 전부 JWT(@AuthenticationPrincipal)에서 가져온다.
 * 예전에는 클라이언트가 보내는 X-USER-ID 헤더를 그대로 믿어서, 헤더 한 줄만 바꾸면
 * 다른 멘토 이름으로 글을 쓰고 지울 수 있었다.
 */
@RestController
@RequestMapping("/api/v1/mentors/{mentorId}/posts")
@RequiredArgsConstructor
public class MentorPostController {

    private final MentorPostService mentorPostService;

    @PostMapping
    public ResponseEntity<MentorPostResponse> createPost(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long mentorId,
            @RequestBody MentorPostRequest request) {

        requireSelf(currentUserId, mentorId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(mentorPostService.createPost(mentorId, request));
    }

    @GetMapping("/{postId}")
    public ResponseEntity<MentorPostResponse> getPost(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long mentorId,
            @PathVariable Long postId) {

        return ResponseEntity.ok(mentorPostService.getPost(currentUserId, mentorId, postId));
    }

    @PutMapping("/{postId}")
    public ResponseEntity<MentorPostResponse> updatePost(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long mentorId,
            @PathVariable Long postId,
            @RequestBody MentorPostRequest request) {

        requireSelf(currentUserId, mentorId);
        return ResponseEntity.ok(mentorPostService.updatePost(mentorId, postId, request));
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<Void> deletePost(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long mentorId,
            @PathVariable Long postId) {

        requireSelf(currentUserId, mentorId);
        mentorPostService.deletePost(mentorId, postId);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<List<MentorPostResponse>> getPosts(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long mentorId) {

        return ResponseEntity.ok(mentorPostService.getPostsByMentorId(currentUserId, mentorId));
    }

    @PostMapping("/{postId}/likes")
    public ResponseEntity<Void> likePost(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long mentorId,
            @PathVariable Long postId) {

        requireLogin(currentUserId);
        mentorPostService.likePost(currentUserId, mentorId, postId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{postId}/likes")
    public ResponseEntity<Void> unlikePost(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long mentorId,
            @PathVariable Long postId) {

        requireLogin(currentUserId);
        mentorPostService.unlikePost(currentUserId, mentorId, postId);
        return ResponseEntity.ok().build();
    }

    private void requireLogin(Long currentUserId) {
        if (currentUserId == null) {
            throw new CustomException(ErrorCode.AUTH_INVALID_CREDENTIALS);
        }
    }

    private void requireSelf(Long currentUserId, Long mentorId) {
        requireLogin(currentUserId);
        if (!currentUserId.equals(mentorId)) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }
    }
}
