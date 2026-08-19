package com.example.findAnswer.mentorbridge.repository;

import com.example.findAnswer.mentorbridge.entity.MentorPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MentorPlanRepository extends JpaRepository<MentorPlan, Long> {
    List<MentorPlan> findByMentorIdAndIsActiveTrue(Long mentorId);
    Optional<MentorPlan> findByIdAndIsActiveTrue(Long id);


}
