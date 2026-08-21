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

    // 만료 처리 벌크 업데이트 직전에, 알림을 보낼 대상(userId)을 미리 조회하는 용도
    List<Subscription> findByStatusInAndCurrentPeriodEndLessThanEqual(List<SubscriptionStatus> statuses, LocalDateTime now);

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
}