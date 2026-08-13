package com.example.findAnswer.mentorbridge.repository;

import com.example.findAnswer.mentorbridge.entity.MentorPost;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface MentorPostRepository extends JpaRepository<MentorPost, Long> {

    // 💡 [추가] postId와 mentorId가 일치하는 게시글만 조회
    Optional<MentorPost> findByIdAndMentorId(Long id, Long mentorId);
}