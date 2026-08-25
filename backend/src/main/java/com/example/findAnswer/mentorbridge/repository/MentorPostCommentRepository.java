package com.example.findAnswer.mentorbridge.repository;

import com.example.findAnswer.mentorbridge.entity.MentorPostComment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MentorPostCommentRepository extends JpaRepository<MentorPostComment, Long> {
    List<MentorPostComment> findByPostIdOrderByCreatedAtAsc(Long postId);
}