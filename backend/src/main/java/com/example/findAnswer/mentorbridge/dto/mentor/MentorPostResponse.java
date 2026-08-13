package com.example.findAnswer.mentorbridge.dto.mentor;

import com.example.findAnswer.mentorbridge.entity.MentorPost;
import java.time.LocalDateTime;

public record MentorPostResponse(
        Long id,
        Long mentorId,
        String title,
        String content,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static MentorPostResponse from(MentorPost post) {
        return new MentorPostResponse(
                post.getId(),
                post.getMentorId(),
                post.getTitle(),
                post.getContent(),
                post.getCreatedAt(),
                post.getUpdatedAt()
        );
    }
}