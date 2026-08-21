package com.example.findAnswer.mentorbridge.repository;

import com.example.findAnswer.mentorbridge.entity.MentorPostLike;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MentorPostLikeRepository extends JpaRepository<MentorPostLike, Long> {
    boolean existsByUserIdAndMentorPostId(Long userId, Long mentorPostId);
    void deleteByUserIdAndMentorPostId(Long userId, Long mentorPostId);
}