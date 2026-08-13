package com.example.findAnswer.mentorbridge.scheduler;

import com.example.findAnswer.mentorbridge.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class SubscriptionScheduler {

    private final SubscriptionRepository subscriptionRepository;

    // 매 10초마다 체크 (테스트용, 잘 적용되는지 보려고 짧게 설정)
    @Scheduled(cron = "*/10 * * * * *")
    @Transactional
    public void expireSubscriptions() {
        LocalDateTime now = LocalDateTime.now();
        int updatedCount = subscriptionRepository.updateExpiredSubscriptions(now);

        if (updatedCount > 0) {
            System.out.println("[구독 만료 스케줄러] 만료 처리된 구독 수: " + updatedCount + "건");
        }
    }
}