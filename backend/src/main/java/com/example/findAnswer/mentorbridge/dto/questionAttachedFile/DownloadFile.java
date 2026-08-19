package com.example.findAnswer.mentorbridge.dto.questionAttachedFile;

import org.springframework.core.io.Resource;

public record DownloadFile(
        Resource resource,
        String originalFileName,
        String contentType
) {}
