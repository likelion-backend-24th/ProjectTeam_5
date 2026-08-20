package com.example.findAnswer.mentorbridge.controller;

import com.example.findAnswer.mentorbridge.service.WebhookEventService;
import com.example.findAnswer.mentorbridge.webhook.PortOneWebhookVerifier;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/webhooks")
public class WebhookController {

    private final PortOneWebhookVerifier webhookVerifier;
    private final WebhookEventService webhookEventService;

    @PostMapping("/portone")
    public ResponseEntity<Void> handlePortOneWebhook(
            @RequestHeader("webhook-id") String webhookId,
            @RequestHeader("webhook-timestamp") String webhookTimestamp,
            @RequestHeader("webhook-signature") String webhookSignature,
            @RequestBody String rawBody // dto가 아니라 원문으로 받아야 한다 서명 검증은 원문이 기준이다
    ){
        webhookVerifier.verify(webhookId, webhookTimestamp, webhookSignature, rawBody);

        try {
            webhookEventService.receive(webhookId, rawBody);
        } catch (DataIntegrityViolationException e) {
            log.info("중복 웹훅으로 판단 무시 : webhookId={}", webhookId);
        }

        return ResponseEntity.ok().build();
    }
}
