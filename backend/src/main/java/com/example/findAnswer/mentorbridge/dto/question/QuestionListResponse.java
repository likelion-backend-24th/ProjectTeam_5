package com.example.findAnswer.mentorbridge.dto.question;

import com.example.findAnswer.mentorbridge.entity.Question;
import lombok.Getter;

import java.time.LocalDateTime;

// 게시판 전체 목록 조회용(답변 목록 제외, 답변 수만 표시)
@Getter
public class QuestionListResponse {

    private Long id;
    private String title;
    private String authorName;
    private int answerCount;
    private LocalDateTime createdAt;
    private String category;

    public static QuestionListResponse from(Question question) {

        QuestionListResponse response = new QuestionListResponse();
        response.id = question.getId();
        response.title = question.getTitle();
        response.authorName = question.getUser().getName();
        response.answerCount = question.getAnswers().size();
        response.createdAt = question.getCreatedAt();
        response.category = question.getCategory();
        return response;
    }
}
