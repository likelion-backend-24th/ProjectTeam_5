package com.example.findAnswer.mentorbridge.dto.mentor;

import com.example.findAnswer.mentorbridge.entity.MentorPost;
import com.example.findAnswer.mentorbridge.entity.MentorPostAttachmentFile;

import java.time.LocalDateTime;
import java.util.List;

public record MentorPostResponse(
        Long id,
        Long mentorId,
        String title,
        String content,
        String category,
        Boolean isPublic,
        List<AttachmentResponse> attachments,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static MentorPostResponse from(MentorPost post) {
        return new MentorPostResponse(
                post.getId(),
                post.getMentor().getId(),
                post.getTitle(),
                post.getContent(),
                post.getCategory(),
                post.getIsPublic(),
                post.getAttachments().stream()
                        .map(AttachmentResponse::from)
                        .toList(),
                post.getCreatedAt(),
                post.getUpdatedAt()
        );
    }

    public record AttachmentResponse(
            Long id,
            String storageKey,
            String originalFileName,
            Long size
    ) {
        public static AttachmentResponse from(MentorPostAttachmentFile file) {
            return new AttachmentResponse(
                    file.getId(),
                    file.getStorageKey(),
                    file.getOriginalFileName(),
                    file.getSize()
            );
        }
    }
}