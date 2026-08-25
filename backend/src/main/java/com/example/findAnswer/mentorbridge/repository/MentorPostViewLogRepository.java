package com.example.findAnswer.mentorbridge.repository;

import com.example.findAnswer.mentorbridge.entity.MentorPostViewLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MentorPostViewLogRepository extends JpaRepository<MentorPostViewLog, Long> {
    boolean existsByUserIdAndPostId(Long userId, Long postId);

    void deleteByPostId(Long postId);
}