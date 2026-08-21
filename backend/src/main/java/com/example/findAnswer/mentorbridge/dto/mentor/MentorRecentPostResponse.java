package com.example.findAnswer.mentorbridge.dto.mentor;

import com.example.findAnswer.mentorbridge.entity.MentorPost;

import java.time.LocalDateTime;

public record MentorRecentPostResponse(
        Long id,
        String title,
        String category,
        Boolean isPublic,
        LocalDateTime createdAt
) {
    public static MentorRecentPostResponse from(MentorPost post) {
        return new MentorRecentPostResponse(
                post.getId(),
                post.getTitle(),
                post.getCategory(),
                post.getIsPublic(),
                post.getCreatedAt()
        );
    }
}
