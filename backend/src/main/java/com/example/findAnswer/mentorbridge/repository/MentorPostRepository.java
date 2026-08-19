package com.example.findAnswer.mentorbridge.repository;

import com.example.findAnswer.mentorbridge.entity.MentorPost;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface MentorPostRepository extends JpaRepository<MentorPost, Long> {

    // 💡 postId와 mentorId가 일치하는 게시글만 단건 조회
    Optional<MentorPost> findByIdAndMentorId(Long id, Long mentorId);

    // 💡 [추가] 특정 멘토의 전체 게시글 목록을 최신순으로 조회
    List<MentorPost> findByMentorIdOrderByCreatedAtDesc(Long mentorId);
}