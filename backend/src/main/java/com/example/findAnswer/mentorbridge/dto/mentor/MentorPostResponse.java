package com.example.findAnswer.mentorbridge.dto.mentor;

import com.example.findAnswer.mentorbridge.entity.MentorPost;
import java.time.LocalDateTime;
import java.util.List;

public record MentorPostResponse(
        Long id,
        Long mentorId,
        String title,
        String content,
        List<Long> attachmentIds, // 💡 [추가] 첨부파일 ID 목록
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static MentorPostResponse from(MentorPost post) {
        return new MentorPostResponse(
                post.getId(),
                post.getMentorId(),
                post.getTitle(),
                post.getContent(),
                post.getAttachmentIds(), // 💡 [추가]
                post.getCreatedAt(),
                post.getUpdatedAt()
        );
    }
}