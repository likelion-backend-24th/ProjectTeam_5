package com.example.findAnswer.mentorbridge.dto.mentor;

import java.util.List;

public record MentorPostRequest(
        String title,
        String content,
        String category,
        Boolean isPublic,
        List<AttachmentRequest> attachments
) {
    public record AttachmentRequest(
            String storageKey,
            String originalFileName,
            Long size
    ) {}
}