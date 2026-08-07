package com.example.findAnswer.dev.repository;

import com.example.findAnswer.dev.domain.MentorApplicationStatus;
import com.example.findAnswer.dev.entity.MentorApplication;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MentorApplicationRepository extends JpaRepository<MentorApplication, Long> {

    List<MentorApplication> findByStatus(MentorApplicationStatus status);
    Optional<MentorApplication> findByUser_IdAndStatus(Long userId, MentorApplicationStatus status);
    boolean existsByUser_IdAndStatus(Long userId, MentorApplicationStatus status);
    void deleteByUserId(Long userId);
    Optional<MentorApplication> findFirstByUser_IdOrderByCreatedAtDesc(Long userId);
}
