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
}