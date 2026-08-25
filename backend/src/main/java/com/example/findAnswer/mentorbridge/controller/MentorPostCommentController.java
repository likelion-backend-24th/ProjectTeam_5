package com.example.findAnswer.mentorbridge.controller;

import com.example.findAnswer.mentorbridge.dto.mentor.MentorPostCommentCreateRequest;
import com.example.findAnswer.mentorbridge.dto.mentor.MentorPostCommentResponse;
import com.example.findAnswer.mentorbridge.service.MentorPostCommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
            @RequestHeader("X-USER-ID") Long userId,
            @RequestBody MentorPostCommentCreateRequest request) {
        MentorPostCommentResponse response = mentorPostCommentService.createComment(postId, userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long mentorId,
            @PathVariable Long postId,
            @PathVariable Long commentId,
            @RequestHeader("X-USER-ID") Long userId) {
        mentorPostCommentService.deleteComment(commentId, userId);
        return ResponseEntity.noContent().build();
    }
}