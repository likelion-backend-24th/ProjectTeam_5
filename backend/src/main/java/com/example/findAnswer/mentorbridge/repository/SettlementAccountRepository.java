package com.example.findAnswer.mentorbridge.repository;

import com.example.findAnswer.mentorbridge.entity.SettlementAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface SettlementAccountRepository extends JpaRepository<SettlementAccount, Long> {
    Optional<SettlementAccount> findByUserId(Long userId);
    boolean existsByUserId(Long userId);

    // 관리자 정산 목록에서 멘토별 계좌를 한 번에 가져온다(행마다 조회하면 N+1).
    List<SettlementAccount> findByUserIdIn(Collection<Long> userIds);
}