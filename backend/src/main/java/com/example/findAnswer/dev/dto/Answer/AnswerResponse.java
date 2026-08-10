package com.example.findAnswer.dev.dto.Answer;

import com.example.findAnswer.dev.entity.Answer;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class AnswerResponse {

    private Long id;
    private Long questionId;
    private Long userId;
    private String content;
    private String authorName;
    private Long parentId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static AnswerResponse from(Answer answer) {
        AnswerResponse response = new AnswerResponse();
        response.id = answer.getId();
        response.questionId = answer.getQuestion().getId();
        response.userId = answer.getUser().getId();
        response.content = answer.getContent();
        response.authorName = answer.getUser().getName();
        response.parentId = answer.getParent() != null ? answer.getParent().getId() : null;
        response.createdAt = answer.getCreatedAt();
        response.updatedAt = answer.getUpdatedAt();
        return response;
    }
}