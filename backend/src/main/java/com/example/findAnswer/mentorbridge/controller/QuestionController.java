package com.example.findAnswer.mentorbridge.controller;

import com.example.findAnswer.mentorbridge.dto.question.*;
import com.example.findAnswer.mentorbridge.service.QuestionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/questions")
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionService questionService;

    //질문 작성 (POST /api/questions) - 201 Created
    @PostMapping
    public ResponseEntity<QuestionResponse> createQuestion(
            @Valid @RequestBody QuestionCreateRequest request,
            @AuthenticationPrincipal Long currentUserId) {

        QuestionResponse response = questionService.createQuestion(currentUserId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    //질문 목록 조회 & 검색 & 정렬 (GET /api/questions) - 200 OK
    @GetMapping
    public ResponseEntity<Page<QuestionListResponse>> getQuestions(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false, defaultValue = "전체") String category,
            @ParameterObject
            @PageableDefault(size = 10) Pageable pageable) {

        // 서비스에서 카테고리, 검색어, 그리고 Pageable 내부의 sort 정보를 함께 처리
        Page<QuestionListResponse> response = questionService.getQuestions(category, keyword, pageable);
        return ResponseEntity.ok(response);
    }

    //질문 상세 조회 (GET /api/questions/{questionId}) - 200 OK
    @GetMapping("/{questionId}")
    public ResponseEntity<QuestionResponse> getQuestion(@PathVariable Long questionId , @AuthenticationPrincipal Long currentUserId) {

        QuestionResponse response = questionService.getQuestion(questionId, currentUserId);
        return ResponseEntity.ok(response);
    }

    // 특정 유저가 작성한 질문 목록 조회 (GET /api/questions/user/{userId})
    @GetMapping("/user/{userId}")
    public ResponseEntity<Page<QuestionListResponse>> getQuestionsByUser(
            @PathVariable Long userId,
            @ParameterObject
            @PageableDefault(size = 10) Pageable pageable) {

        Page<QuestionListResponse> response = questionService.getQuestionsByUserId(userId, pageable);
        return ResponseEntity.ok(response);
    }

    //좋아요 토글 api
    @PostMapping("/{questionId}/like")
    public ResponseEntity<QuestionLikeResponse> toggleLike(
            @PathVariable Long questionId,
            @AuthenticationPrincipal Long currentUserId) {

        QuestionLikeResponse response = questionService.toggleLike(questionId, currentUserId);
        return ResponseEntity.ok(response);
    }

    //질문 수정 (PATCH /api/questions/{questionId}) - 200 OK
    @PatchMapping("/{questionId}")
    public ResponseEntity<QuestionResponse> updateQuestion(
            @PathVariable Long questionId,
            @Valid @RequestBody QuestionUpdateRequest request,
            @AuthenticationPrincipal Long currentUserId) {

        QuestionResponse response = questionService.updateQuestion(questionId, currentUserId, request);
        return ResponseEntity.ok(response);
    }

    //질문 삭제 (DELETE /api/questions/{questionId}) - 204 No Content
    @DeleteMapping("/{questionId}")
    public ResponseEntity<Void> deleteQuestion(
            @PathVariable Long questionId,
            @AuthenticationPrincipal Long currentUserId) {

        questionService.deleteQuestion(questionId, currentUserId);
        return ResponseEntity.noContent().build();
    }
}