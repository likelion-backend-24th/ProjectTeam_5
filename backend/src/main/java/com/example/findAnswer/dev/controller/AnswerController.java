package com.example.findAnswer.dev.controller;

import com.example.findAnswer.dev.dto.Answer.AnswerCreateRequest;
import com.example.findAnswer.dev.dto.Answer.AnswerResponse;
import com.example.findAnswer.dev.dto.Answer.AnswerUpdateRequest;
import com.example.findAnswer.dev.service.AnswerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class AnswerController {

    private final AnswerService answerService;

    //답변 작성 (POST /api/questions/{questionId}/answers) - 201 Created
    @PostMapping("/api/questions/{questionId}/answers")
    public ResponseEntity<AnswerResponse> createAnswer(
            @PathVariable Long questionId,
            @AuthenticationPrincipal Long currentUserId,
            @Valid @RequestBody AnswerCreateRequest request) {

        AnswerResponse response = answerService.createAnswer(questionId, currentUserId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    //특정 질문의 답변 목록 조회 (GET /api/questions/{questionId}/answers) - 200 OK
    @GetMapping("/api/questions/{questionId}/answers")
    public ResponseEntity<List<AnswerResponse>> getAnswers(@PathVariable Long questionId) {

        List<AnswerResponse> responses = answerService.getAnswersByQuestionId(questionId);
        return ResponseEntity.ok(responses);
    }

    //답변 수정 (PUT /api/answers/{answerId}) - 200 OK
    @PutMapping("/api/answers/{answerId}")
    public ResponseEntity<AnswerResponse> updateAnswer(
            @PathVariable Long answerId,
            @AuthenticationPrincipal Long currentUserId,
            @Valid @RequestBody AnswerUpdateRequest request) {

        AnswerResponse response = answerService.updateAnswer(answerId, currentUserId, request);
        return ResponseEntity.ok(response);
    }

    //답변 삭제 (DELETE /api/answers/{answerId}) - 204 No Content
    @DeleteMapping("/api/answers/{answerId}")
    public ResponseEntity<Void> deleteAnswer(
            @PathVariable Long answerId,
            @AuthenticationPrincipal Long currentUserId) {

        answerService.deleteAnswer(answerId, currentUserId);
        return ResponseEntity.noContent().build();
    }
}
