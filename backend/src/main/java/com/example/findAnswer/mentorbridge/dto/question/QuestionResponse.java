package com.example.findAnswer.mentorbridge.dto.question;

import com.example.findAnswer.mentorbridge.dto.answer.AnswerResponse;
import com.example.findAnswer.mentorbridge.entity.Question;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

// 질문 상세 페이지 조회용(답변 목록 포함)
@Getter
public class QuestionResponse {
    private Long id;
    private String title;
    private String content;
    private String authorName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<AnswerResponse> answers;
    private String category;

    public static QuestionResponse from(Question question) {
        QuestionResponse response = new QuestionResponse();
        response.id = question.getId();
        response.title = question.getTitle();
        response.content = question.getContent();
        response.authorName = question.getUser().getName();
        response.createdAt = question.getCreatedAt();
        response.updatedAt = question.getUpdatedAt();
        response.category = question.getCategory();
        response.answers = question.getAnswers().stream()
                .map(AnswerResponse::from)
                .collect(Collectors.toList());
        return response;
    }
}
