package com.example.findAnswer.mentorbridge.repository;

import com.example.findAnswer.mentorbridge.constants.SubscriptionStatus;
import com.example.findAnswer.mentorbridge.entity.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    Optional<Subscription> findByUserIdAndMentor_Id(Long userId, Long mentorId);

    List<Subscription> findByUserIdAndStatusInAndCurrentPeriodEndAfter(
            Long userId,
            List<SubscriptionStatus> statuses,
            LocalDateTime now
    );

    boolean existsByUserIdAndMentor_IdAndStatusIn(Long userId, Long mentorId, List<SubscriptionStatus> statuses);

    @Modifying(clearAutomatically = true)
    @Query(value = "UPDATE subscription SET status = 'EXPIRED' " +
            "WHERE current_period_end <= :now " +
            "AND status IN ('ACTIVE', 'CANCEL_RESERVED')",
            nativeQuery = true)
    int updateExpiredSubscriptions(@Param("now") LocalDateTime now);

    long countByMentor_IdAndStatusInAndCurrentPeriodEndAfter(
            Long mentorId,
            List<SubscriptionStatus> statuses,
            LocalDateTime now
    );

    // 멘토 대시보드 — 이 멘토의 전체 구독자 목록(최신 가입순)
    List<Subscription> findByMentor_IdOrderByCreatedAtDesc(Long mentorId);
}