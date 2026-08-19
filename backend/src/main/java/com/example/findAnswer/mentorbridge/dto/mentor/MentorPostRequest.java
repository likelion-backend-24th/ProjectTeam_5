package com.example.findAnswer.mentorbridge.dto.mentor;

import java.util.List;

public record MentorPostRequest(
        String title,
        String content,
        List<Long> attachmentIds // 💡 [추가] 첨부파일 ID 목록
) {}