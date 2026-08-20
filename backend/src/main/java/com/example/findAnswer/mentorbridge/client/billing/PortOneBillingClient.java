package com.example.findAnswer.mentorbridge.client.billing;

import com.example.findAnswer.mentorbridge.constants.ErrorCode;
import com.example.findAnswer.mentorbridge.constants.PaymentProvider;
import com.example.findAnswer.mentorbridge.dto.billing.BillingRegisterResult;
import com.example.findAnswer.mentorbridge.exception.CustomException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import tools.jackson.databind.JsonNode;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

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

    // 등록된 카드(빌링키)로 즉시 결제 실행. POST /payments/{paymentId}/billing-key
    // 요청 성공(2xx)만 확인하고 실제 확정은 호출부에서 PaymentSyncService로 재조회해서 한다(원칙 2).
    public void payWithBillingKey(String paymentId, String billingKey, String channelKey, String orderName,
                                   Long amount, String currency,
                                   String customerName, String customerPhone, String customerEmail) {
        try {
            restClient.post()
                    .uri(apiBaseUrl + "/payments/{paymentId}/billing-key", paymentId)
                    .header("Authorization", "PortOne " + apiSecret)
                    .body(new BillingKeyPayRequest(
                            billingKey, storeId, channelKey, orderName,
                            new Customer(customerName, customerPhone, customerEmail),
                            new Amount(amount), currency
                    ))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException e) {
            log.warn("빌링키 결제 실행 실패 paymentId={} : {}", paymentId, e.getMessage());
            throw new CustomException(ErrorCode.PAYMENT_VERIFICATION_FAILED);
        }
    }

    // 다음 회차 결제 예약. POST /payments/{paymentId}/schedule → 예약 ID 반환.
    // ⚠️ 요청/응답 필드는 공식 문서에 상세 스키마가 없어 결제 실행 API와 같은 구조로 추정해서 짬 —
    // 실제 예약 1건 걸어보고 응답 원문을 로그로 찍어 재확인 필요.
    public String createSchedule(String paymentId, String billingKey, String channelKey, String orderName,
                                  Long amount, String currency, LocalDateTime timeToPay,
                                  String customerName, String customerPhone, String customerEmail) {
        String timeToPayIso = timeToPay.atZone(ZoneId.of("Asia/Seoul")).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);

        JsonNode body;
        try {
            body = restClient.post()
                    .uri(apiBaseUrl + "/payments/{paymentId}/schedule", paymentId)
                    .header("Authorization", "PortOne " + apiSecret)
                    .body(new CreateScheduleRequest(
                            new SchedulePaymentInput(
                                    billingKey, storeId, channelKey, orderName,
                                    new Customer(customerName, customerPhone, customerEmail),
                                    new Amount(amount), currency
                            ),
                            timeToPayIso
                    ))
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientResponseException e) {
            log.warn("결제 예약 생성 실패 paymentId={} : {}", paymentId, e.getMessage());
            throw new CustomException(ErrorCode.PAYMENT_SCHEDULE_FAILED);
        }

        if (body == null) {
            throw new CustomException(ErrorCode.PAYMENT_SCHEDULE_FAILED);
        }

        String scheduleId = text(body, "id");
        if (scheduleId == null) {
            scheduleId = text(body.path("schedule"), "id"); // ⚠️ 응답이 {schedule:{id:...}} 형태일 가능성 대비
        }
        if (scheduleId == null) {
            log.warn("결제 예약 생성 응답에서 id를 못 찾음: {}", body);
            throw new CustomException(ErrorCode.PAYMENT_SCHEDULE_FAILED);
        }
        return scheduleId;
    }

    // 예약 취소. DELETE /payment-schedules — scheduleId 하나만 정확히 취소(같은 카드의 다른 구독 예약은 안 건드림).
    public void cancelSchedule(String scheduleId) {
        try {
            restClient.method(HttpMethod.DELETE)
                    .uri(apiBaseUrl + "/payment-schedules")
                    .header("Authorization", "PortOne " + apiSecret)
                    .body(new RevokeScheduleRequest(storeId, List.of(scheduleId)))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException e) {
            log.warn("결제 예약 취소 실패 scheduleId={} : {}", scheduleId, e.getMessage());
            throw new CustomException(ErrorCode.PAYMENT_SCHEDULE_FAILED);
        }
    }

    private record Amount(long total) {
    }

    private record Customer(String fullName, String phoneNumber, String email) {
    }

    private record BillingKeyPayRequest(String billingKey, String storeId, String channelKey, String orderName,
                                         Customer customer, Amount amount, String currency) {
    }

    private record SchedulePaymentInput(String billingKey, String storeId, String channelKey, String orderName,
                                         Customer customer, Amount amount, String currency) {
    }

    private record CreateScheduleRequest(SchedulePaymentInput payment, String timeToPay) {
    }

    private record RevokeScheduleRequest(String storeId, List<String> scheduleIds) {
    }
}
