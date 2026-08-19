package com.example.findAnswer.mentorbridge.dto.mentor;

import com.example.findAnswer.mentorbridge.entity.MentorPost;
import java.time.LocalDateTime;
import java.util.List;

public record MentorPostResponse(
        Long id,
        Long mentorId,
        String title,
        String content,
        String category,       // 💡 [추가]
        Boolean isPublic,      // 💡 [추가]
        List<Long> attachmentIds,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static MentorPostResponse from(MentorPost post) {
        return new MentorPostResponse(
                post.getId(),
                post.getMentorId(),
                post.getTitle(),
                post.getContent(),
                post.getCategory(),     // 💡 [추가]
                post.getIsPublic(),     // 💡 [추가]
                post.getAttachmentIds(),
                post.getCreatedAt(),
                post.getUpdatedAt()
        );
    }
}