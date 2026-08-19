package com.example.findAnswer.mentorbridge.dto.question;

import com.example.findAnswer.mentorbridge.dto.answer.AnswerResponse;
import com.example.findAnswer.mentorbridge.entity.Question;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;

import java.awt.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

// 질문 상세 페이지 조회용(답변 목록 포함)
@Getter
public class QuestionResponse {
    private Long id;
    private Long userId;
    private String title;
    private String content;
    private String authorName;
    private String authorProfileImageUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<AnswerResponse> answers;
    private String category;
    private int likeCount;

    @JsonProperty("isLiked")
    private boolean isLiked;
    private List<ImageResponse> images;
//    private List<String> imageUrls;   // 첨부 이미지 CDN URL 목록 (없으면 빈 리스트)


    // 이미지 URL은 storageKey로부터 서비스에서 생성해 넘겨준다.
    public static QuestionResponse from(Question question, List<ImageResponse> images, boolean isLiked) {
        QuestionResponse response = new QuestionResponse();
        response.id = question.getId();
        response.userId = question.getUser().getId();
        response.title = question.getTitle();
        response.content = question.getContent();
        response.authorName = question.getUser().getName();
        response.authorProfileImageUrl = question.getUser().getProfileImageUrl();
        response.createdAt = question.getCreatedAt();
        response.updatedAt = question.getUpdatedAt();
        response.category = question.getCategory();
        response.answers = question.getAnswers().stream()
                .map(AnswerResponse::from)
                .collect(Collectors.toList());
        response.likeCount = question.getLikeCount();
        response.isLiked = isLiked;
        response.images = (images == null) ? List.of() : images;
        return response;
    }

    public static QuestionResponse from(Question question) {
        return from(question, List.of(), false);
    }
}
