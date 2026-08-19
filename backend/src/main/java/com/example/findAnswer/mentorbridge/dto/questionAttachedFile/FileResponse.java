package com.example.findAnswer.mentorbridge.dto.questionAttachedFile;

public record FileResponse(
        Long attachId,
        String originalFileName,
        Long size,
        String downloadUrl   // ex) /api/attachments/files/{attachId}/download
) {
}
