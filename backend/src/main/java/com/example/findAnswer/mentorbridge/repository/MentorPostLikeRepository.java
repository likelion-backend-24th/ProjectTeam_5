package com.example.findAnswer.mentorbridge.repository;

import com.example.findAnswer.mentorbridge.entity.MentorPostLike;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MentorPostLikeRepository extends JpaRepository<MentorPostLike, Long> {
    boolean existsByUserIdAndMentorPostId(Long userId, Long mentorPostId);
    void deleteByUserIdAndMentorPostId(Long userId, Long mentorPostId);

    // 게시글을 지우기 전에 좋아요 행을 먼저 지우지 않으면 FK 제약 위반으로 500이 난다.
    void deleteByMentorPostId(Long mentorPostId);
}