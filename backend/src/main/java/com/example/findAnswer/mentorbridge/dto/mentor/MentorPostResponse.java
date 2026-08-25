package com.example.findAnswer.mentorbridge.dto.mentor;

import com.example.findAnswer.mentorbridge.dto.question.ImageResponse;
import com.example.findAnswer.mentorbridge.dto.questionAttachedFile.FileResponse;
import com.example.findAnswer.mentorbridge.entity.MentorPost;

import java.time.LocalDateTime;
import java.util.List;

public record MentorPostResponse(
        Long id,
        Long mentorId,
        String title,
        String content,
        String category,
        Boolean isPublic,
        List<ImageResponse> images,
        List<FileResponse> files,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        boolean liked,
        long likeCount,
        long viewCount
) {
    public static MentorPostResponse from(MentorPost post, List<ImageResponse> images, List<FileResponse> files, boolean liked, long likeCount) {
        return new MentorPostResponse(
                post.getId(),
                post.getMentor().getId(),
                post.getTitle(),
                post.getContent(),
                post.getCategory(),
                post.getIsPublic(),
                images == null ? List.of() : images,
                files == null ? List.of() : files,
                post.getCreatedAt(),
                post.getUpdatedAt(),
                liked,
                likeCount,
                post.getViewCount()
        );
    }

    /**
     * 구독자 전용 글을 비구독자에게 내려줄 때 쓴다.
     * 목록에 카드로는 보이되 본문·첨부는 빠진다 — 화면의 자물쇠 표시가 실제로 의미를 갖게 하는 부분.
     */
    public static MentorPostResponse locked(MentorPost post, boolean liked) {
        return new MentorPostResponse(
                post.getId(),
                post.getMentor().getId(),
                post.getTitle(),
                null,
                post.getCategory(),
                post.getIsPublic(),
                List.of(),
                List.of(),
                post.getCreatedAt(),
                post.getUpdatedAt(),
                liked,
                post.getLikeCount(),
                post.getViewCount()
        );
    }
}