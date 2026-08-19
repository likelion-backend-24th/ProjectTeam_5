package com.example.findAnswer.mentorbridge.dto.mentor;

import java.util.List;

public record MentorPostRequest(
        String title,
        String content,
        String category,       // 💡 [추가] 카테고리
        Boolean isPublic,      // 💡 [추가] 전체공개 여부 (true/false)
        List<Long> attachmentIds // 💡 [추가] 첨부파일 ID 목록
) {
}