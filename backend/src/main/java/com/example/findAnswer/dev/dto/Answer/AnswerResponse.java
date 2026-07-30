package com.example.findAnswer.dev.dto.Answer;

import com.example.findAnswer.dev.entity.Answer;
import lombok.Getter;

import java.time.LocalDateTime;

//답변 조회 및 응답용
@Getter
public class AnswerResponse {

    private Long id;
    private String content;
    private String authorName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static AnswerResponse from(Answer answer) {

        AnswerResponse response = new AnswerResponse();
        response.id = answer.getId();
        response.content = answer.getContent();
        response.authorName = answer.getUser().getName();
        response.createdAt = answer.getCreatedAt();
        response.updatedAt = answer.getUpdatedAt();
        return response;
    }
}
