package com.example.findAnswer.mentorbridge.repository;

import com.example.findAnswer.mentorbridge.entity.QuestionLike;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface QuestionLikeRepository extends JpaRepository<QuestionLike, Long> {

    Optional<QuestionLike> findByQuestion_IdAndUser_Id(Long questionId, Long userId);
    boolean existsByQuestion_IdAndUser_Id(Long questionId, Long userId);
}
