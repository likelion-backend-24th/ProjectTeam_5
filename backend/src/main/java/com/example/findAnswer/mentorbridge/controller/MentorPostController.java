package com.example.findAnswer.mentorbridge.controller;

import com.example.findAnswer.mentorbridge.annotation.RequireSubscription;
import com.example.findAnswer.mentorbridge.dto.mentor.MentorPostRequest;
import com.example.findAnswer.mentorbridge.dto.mentor.MentorPostResponse;
import com.example.findAnswer.mentorbridge.service.MentorPostService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/mentors/{mentorId}/posts")
@RequiredArgsConstructor
public class MentorPostController {

    private final MentorPostService mentorPostService;

    // F-41: 멘토 본인 게시글 작성
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

    // F-41: 멘토 게시글 단건 조회 (구독 여부 자동 검증!)
    @GetMapping("/{postId}")
    @RequireSubscription // <-- URL의 {mentorId}를 읽어서 구독 유효성을 AOP가 자동 검사합니다.
    public ResponseEntity<MentorPostResponse> getPost(
            @PathVariable Long mentorId,
            @PathVariable Long postId) {

        // 💡 mentorId와 postId를 모두 넘겨주도록 수정
        return ResponseEntity.ok(mentorPostService.getPost(mentorId, postId));
    }

    // F-41: 멘토 본인 게시글 수정
    @PutMapping("/{postId}")
    public ResponseEntity<MentorPostResponse> updatePost(
            @RequestHeader("X-USER-ID") Long userId,
            @PathVariable Long mentorId,
            @PathVariable Long postId,
            @RequestBody MentorPostRequest request) {

        return ResponseEntity.ok(mentorPostService.updatePost(userId, postId, request));
    }

    // F-41: 멘토 본인 게시글 삭제
    @DeleteMapping("/{postId}")
    public ResponseEntity<Void> deletePost(
            @RequestHeader("X-USER-ID") Long userId,
            @PathVariable Long mentorId,
            @PathVariable Long postId) {

        mentorPostService.deletePost(userId, postId);
        return ResponseEntity.ok().build();
    }
}