package com.example.findAnswer.mentorbridge.repository;

import com.example.findAnswer.mentorbridge.entity.WebhookEvent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WebhookEventRepository extends JpaRepository<WebhookEvent, Long> {

    boolean existsByWebhookId(String webhookId);
}
