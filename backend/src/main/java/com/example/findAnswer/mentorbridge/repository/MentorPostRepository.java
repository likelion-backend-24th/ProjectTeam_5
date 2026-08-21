package com.example.findAnswer.mentorbridge.repository;

import com.example.findAnswer.mentorbridge.entity.MentorPost;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface MentorPostRepository extends JpaRepository<MentorPost, Long> {

    Optional<MentorPost> findByIdAndMentor_Id(Long id, Long mentorId);

    List<MentorPost> findByMentor_IdOrderByCreatedAtDesc(Long mentorId);

    long countByMentor_Id(Long mentorId);

    long countByMentor_IdAndCreatedAtAfter(Long mentorId, LocalDateTime after);
}