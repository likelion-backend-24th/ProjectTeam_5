package com.example.findAnswer.mentorbridge.client.billing;

import com.example.findAnswer.mentorbridge.constants.ErrorCode;
import com.example.findAnswer.mentorbridge.constants.PaymentProvider;
import com.example.findAnswer.mentorbridge.dto.billing.BillingRegisterResult;
import com.example.findAnswer.mentorbridge.exception.CustomException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import tools.jackson.databind.JsonNode;

// PortOnePaymentClient와 같은 패턴: 프론트가 넘긴 값을 그대로 믿지 않고 PortOne 서버에 재조회해서 확정한다.
@Slf4j
@Component
public class PortOneBillingClient implements BillingClient {

    @Value("${portone.api-base-url}")
    private String apiBaseUrl;

    @Value("${portone.api-secret}")
    private String apiSecret;

    @Value("${portone.store-id}")
    private String storeId;

    private final RestClient restClient = RestClient.create();

    @Override
    public BillingRegisterResult register(String billingKey) {
        JsonNode body;
        try {
            body = restClient.get()
                    .uri(apiBaseUrl + "/billing-keys/{billingKey}", billingKey)
                    .header("Authorization", "PortOne " + apiSecret)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientResponseException e) {
            log.warn("PortOne 빌링키 조회 실패: {}", e.getMessage());
            throw new CustomException(ErrorCode.BILLING_KEY_VERIFICATION_FAILED);
        }

        if (body == null) {
            throw new CustomException(ErrorCode.BILLING_KEY_VERIFICATION_FAILED);
        }

        String status = text(body, "status");
        String remoteStoreId = text(body, "storeId");

        // ⚠️ status 값("ISSUED")과 storeId 필드 위치는 PortOne 공식 문서에 상세 스키마가 없어 결제 단건조회
        // 응답(PortOnePaymentSnapshot)과 같은 구조라고 가정하고 짠 것 — 실제 빌링키 발급 테스트 후 로그로 재확인 필요.
        boolean verified = "ISSUED".equals(status) && storeId.equals(remoteStoreId);

        if (!verified) {
            log.warn("빌링키 검증 실패: status={}, remoteStoreId={}", status, remoteStoreId);
            throw new CustomException(ErrorCode.BILLING_KEY_VERIFICATION_FAILED);
        }

        return new BillingRegisterResult(
                PaymentProvider.PORTONE,
                billingKey,
                extractCardBrand(body),
                extractLast4(body)
        );
    }

    // ⚠️ 카드사명/마지막 4자리가 담기는 정확한 필드 경로는 실제 발급 응답을 로그로 찍어서 재확인 필요.
    // methods[0].card.name 형태로 추정 — 없으면 화면 표시용 기본값으로 대체(검증 로직과는 무관, 결제 자체엔 영향 없음).
    private String extractCardBrand(JsonNode body) {
        JsonNode card = body.path("methods").path(0).path("card");
        String name = text(card, "name");
        return name != null ? name : "카드";
    }

    private String extractLast4(JsonNode body) {
        JsonNode card = body.path("methods").path(0).path("card");
        String number = text(card, "number");
        if (number != null) {
            String digitsOnly = number.replaceAll("\\D", "");
            if (digitsOnly.length() >= 4) {
                return digitsOnly.substring(digitsOnly.length() - 4);
            }
        }
        return "0000";
    }

    private String text(JsonNode node, String field) {
        JsonNode v = node.get(field);
        return (v == null || v.isNull()) ? null : v.asString();
    }
}
