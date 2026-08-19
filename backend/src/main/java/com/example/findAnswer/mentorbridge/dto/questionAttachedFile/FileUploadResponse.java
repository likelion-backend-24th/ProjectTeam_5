package com.example.findAnswer.mentorbridge.dto.questionAttachedFile;

public record FileUploadResponse(
        Long attachId,
        String originalFileName,
        Long size
) {
}