package com.example.findAnswer.mentorbridge.dto.mentor;

import com.example.findAnswer.mentorbridge.entity.MentorPostComment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class MentorPostCommentResponse {
    private Long id;
    private Long userId;
    private String authorName;
    private String content;
    private LocalDateTime createdAt;

    public static MentorPostCommentResponse from(MentorPostComment comment, String authorName) {
        return MentorPostCommentResponse.builder()
                .id(comment.getId())
                .userId(comment.getUserId())
                .authorName(authorName)
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .build();
    }
}