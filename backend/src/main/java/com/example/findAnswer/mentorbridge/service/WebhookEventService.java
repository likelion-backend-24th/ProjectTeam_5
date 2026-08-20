package com.example.findAnswer.mentorbridge.service;

import com.example.findAnswer.mentorbridge.constants.ErrorCode;
import com.example.findAnswer.mentorbridge.constants.WebhookEventStatus;
import com.example.findAnswer.mentorbridge.entity.WebhookEvent;
import com.example.findAnswer.mentorbridge.exception.CustomException;
import com.example.findAnswer.mentorbridge.repository.PaymentRepository;
import com.example.findAnswer.mentorbridge.repository.WebhookEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.Set;

@Service
@Slf4j
@RequiredArgsConstructor
public class WebhookEventService {

    private static final Set<String> HANDLED_TYPES = Set.of("Transaction.Paid", "Transaction.PayPending", "Transaction.Failed");

    private final WebhookEventRepository webhookEventRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentSyncService paymentSyncService;
    private final ObjectMapper objectMapper;

    private JsonNode parse(String rawBody) {
        try {
            return objectMapper.readTree(rawBody);
        } catch (Exception e) {
            throw new CustomException(ErrorCode.WEBHOOK_PAYLOAD_INVALID);
        }
    }

    private String text(JsonNode node, String field) {
        JsonNode v = node.get(field);
        return (v == null || v.isNull()) ? null : v.asString();
    }

    private String extractPaymentId(JsonNode json) {
        JsonNode data = json.path("data");
        if (data.has("paymentId")) return data.get("paymentId").asString(null);
        if (json.has("paymentId")) return json.get("paymentId").asString(null);
        return null;
    }

    @Transactional
    public void receive(String webhookId, String rawBody){
        if(webhookEventRepository.existsByWebhookId(webhookId)){
            return; // 같은 웹훅 전송시 리턴 - 이미 처리됨
        }

        JsonNode json = parse(rawBody);
        String paymentId = extractPaymentId(json);
        String eventType = json.get("eventType").asString();

        WebhookEvent webhookEvent = webhookEventRepository.save(
                WebhookEvent.builder()
                        .webhookId(webhookId)
                        .eventType(eventType)
                        .payload(rawBody)
                        .status(WebhookEventStatus.RECEIVED)
                        .build()
        );


        if(!HANDLED_TYPES.contains(eventType) || paymentId == null || paymentRepository.findByPaymentId(paymentId).isEmpty()){
            webhookEvent.markIgnored();
            return;
        }

        try {
            paymentSyncService.syncFromWebhook(paymentId);
            webhookEvent.markProcessed();
        } catch (CustomException e) {
            log.warn("웹훅 동기화 중 에러발생: webhookId={}, eventType={}, paymentId={}, errorCode={}", webhookId, eventType, paymentId, e.getErrorCode());
            webhookEvent.markProcessed();
        }

    }


}
