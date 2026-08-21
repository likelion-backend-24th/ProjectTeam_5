package com.example.findAnswer.mentorbridge.controller;

import com.example.findAnswer.mentorbridge.dto.mentor.MentorPostRequest;
import com.example.findAnswer.mentorbridge.dto.mentor.MentorPostResponse;
import com.example.findAnswer.mentorbridge.service.MentorPostService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/mentors/{mentorId}/posts")
@RequiredArgsConstructor
public class MentorPostController {

    private final MentorPostService mentorPostService;

    @PostMapping
    public ResponseEntity<MentorPostResponse> createPost(
            @RequestHeader("X-USER-ID") Long userId,
            @PathVariable Long mentorId,
            @RequestBody MentorPostRequest request) {

        if (!userId.equals(mentorId)) {
            throw new IllegalArgumentException("멘토 본인만 작성할 수 있습니다.");
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(mentorPostService.createPost(mentorId, request));
    }

    @GetMapping("/{postId}")
    public ResponseEntity<MentorPostResponse> getPost(
            @RequestHeader(value = "X-USER-ID", required = false) Long userId,
            @PathVariable Long mentorId,
            @PathVariable Long postId) {

        return ResponseEntity.ok(mentorPostService.getPost(userId, mentorId, postId));
    }

    @PutMapping("/{postId}")
    public ResponseEntity<MentorPostResponse> updatePost(
            @RequestHeader("X-USER-ID") Long userId,
            @PathVariable Long mentorId,
            @PathVariable Long postId,
            @RequestBody MentorPostRequest request) {

        if (!userId.equals(mentorId)) {
            throw new IllegalArgumentException("멘토 본인만 수정할 수 있습니다.");
        }

        return ResponseEntity.ok(mentorPostService.updatePost(mentorId, postId, request));
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<Void> deletePost(
            @RequestHeader("X-USER-ID") Long userId,
            @PathVariable Long mentorId,
            @PathVariable Long postId) {

        if (!userId.equals(mentorId)) {
            throw new IllegalArgumentException("멘토 본인만 삭제할 수 있습니다.");
        }

        mentorPostService.deletePost(mentorId, postId);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<List<MentorPostResponse>> getPosts(@PathVariable Long mentorId) {
        return ResponseEntity.ok(mentorPostService.getPostsByMentorId(mentorId));
    }

    @PostMapping("/{postId}/likes")
    public ResponseEntity<Void> toggleLike(
            @RequestHeader("X-USER-ID") Long userId,
            @PathVariable Long mentorId,
            @PathVariable Long postId) {

        mentorPostService.toggleLike(userId, mentorId, postId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{postId}/likes")
    public ResponseEntity<Void> cancelLike(
            @RequestHeader("X-USER-ID") Long userId,
            @PathVariable Long mentorId,
            @PathVariable Long postId) {

        mentorPostService.toggleLike(userId, mentorId, postId);
        return ResponseEntity.ok().build();
    }
}