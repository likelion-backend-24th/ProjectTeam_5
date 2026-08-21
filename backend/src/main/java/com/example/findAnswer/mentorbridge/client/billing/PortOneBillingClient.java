package com.example.findAnswer.mentorbridge.client.billing;

import com.example.findAnswer.mentorbridge.constants.ErrorCode;
import com.example.findAnswer.mentorbridge.constants.PaymentProvider;
import com.example.findAnswer.mentorbridge.dto.billing.BillingRegisterResult;
import com.example.findAnswer.mentorbridge.exception.CustomException;
import io.portone.sdk.server.common.Card;
import io.portone.sdk.server.payment.billingkey.BillingKeyClient;
import io.portone.sdk.server.payment.billingkey.BillingKeyInfo;
import io.portone.sdk.server.payment.billingkey.BillingKeyPaymentMethod;
import io.portone.sdk.server.payment.billingkey.BillingKeyPaymentMethodCard;
import io.portone.sdk.server.payment.billingkey.BillingKeyPaymentMethodEasyPay;
import io.portone.sdk.server.payment.billingkey.IssuedBillingKeyInfo;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
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
import java.util.Map;
import java.util.concurrent.ExecutionException;

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

    // 빌링키 조회(단건)만 PortOne 공식 서버 SDK(io.portone:server-sdk)로 뺐다 — 나머지(결제 실행/예약)는
    // 그 SDK에 PaymentClient/PaymentScheduleClient가 따로 있어서 지금 범위 밖. 내부에 OkHttp 기반 HttpClient를
    // 들고 있는 Closeable이라 요청마다 새로 만들지 않고 하나만 만들어 재사용 + 종료 시 close() 한다.
    private BillingKeyClient billingKeyClient;

    @PostConstruct
    private void initBillingKeyClient() {
        billingKeyClient = new BillingKeyClient(apiSecret, apiBaseUrl, storeId);
    }

    @PreDestroy
    public void closeBillingKeyClient() {
        if (billingKeyClient != null) {
            billingKeyClient.close();
        }
    }

    @Override
    public BillingRegisterResult register(String billingKey) {
        BillingKeyInfo info;
        try {
            info = billingKeyClient.getBillingKeyInfo(billingKey).get();
        } catch (ExecutionException e) {
            log.warn("PortOne 빌링키 조회 실패: {}", e.getCause() != null ? e.getCause().getMessage() : e.getMessage());
            throw new CustomException(ErrorCode.BILLING_KEY_VERIFICATION_FAILED);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new CustomException(ErrorCode.BILLING_KEY_VERIFICATION_FAILED);
        }

        // status가 "ISSUED"(=IssuedBillingKeyInfo)가 아니면 삭제됐거나(DeletedBillingKeyInfo) SDK가 모르는
        // 응답(Unrecognized)이다 — 발급 인증이 실패해서 애초에 존재하지 않는 빌링키였다면 위 get()에서
        // BillingKeyNotFoundException으로 이미 걸러졌을 것.
        if (!(info instanceof IssuedBillingKeyInfo issued)) {
            log.warn("빌링키 검증 실패: 발급 완료 상태가 아님 (info={})", info);
            throw new CustomException(ErrorCode.BILLING_KEY_VERIFICATION_FAILED);
        }

        if (!storeId.equals(issued.getStoreId())) {
            log.warn("빌링키 검증 실패: storeId 불일치 remoteStoreId={}", issued.getStoreId());
            throw new CustomException(ErrorCode.BILLING_KEY_VERIFICATION_FAILED);
        }

        return new BillingRegisterResult(
                PaymentProvider.PORTONE,
                billingKey,
                extractCardBrand(issued),
                extractLast4(issued)
        );
    }

    // 흔한 간편결제 PG사 코드 → 화면 표시용 한글 이름. 목록에 없는 코드는 그냥 원문 코드를 보여준다.
    private static final Map<String, String> EASY_PAY_LABELS = Map.of(
            "KAKAOPAY", "카카오페이",
            "NAVERPAY", "네이버페이",
            "TOSSPAY", "토스페이",
            "PAYCO", "페이코",
            "SAMSUNGPAY", "삼성페이"
    );

    private BillingKeyPaymentMethod firstMethod(IssuedBillingKeyInfo issued) {
        List<BillingKeyPaymentMethod> methods = issued.getMethods();
        return (methods == null || methods.isEmpty()) ? null : methods.get(0);
    }

    // methods[0]이 카드면 카드 상품명, 간편결제(카카오페이 등)면 PG사 이름을 반환한다.
    // 둘 다 아니거나 상세 정보가 없으면 화면 표시용 기본값으로 대체(검증 로직과는 무관, 결제 자체엔 영향 없음).
    private String extractCardBrand(IssuedBillingKeyInfo issued) {
        BillingKeyPaymentMethod method = firstMethod(issued);

        if (method instanceof BillingKeyPaymentMethodCard cardMethod) {
            Card card = cardMethod.getCard();
            String name = card != null ? card.getName() : null;
            return name != null ? name : "카드";
        }
        if (method instanceof BillingKeyPaymentMethodEasyPay easyPay) {
            String code = easyPay.getProvider() != null ? easyPay.getProvider().getValue() : null;
            return EASY_PAY_LABELS.getOrDefault(code, code != null ? code : "간편결제");
        }
        return "카드";
    }

    // 카드일 때만 마지막 4자리가 의미 있다 — 간편결제 등은 카드번호 개념이 없어서 자리표시자를 반환한다.
    private String extractLast4(IssuedBillingKeyInfo issued) {
        if (firstMethod(issued) instanceof BillingKeyPaymentMethodCard cardMethod) {
            Card card = cardMethod.getCard();
            String number = card != null ? card.getNumber() : null;
            if (number != null) {
                String digitsOnly = number.replaceAll("\\D", "");
                if (digitsOnly.length() >= 4) {
                    return digitsOnly.substring(digitsOnly.length() - 4);
                }
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
                            new Customer(new CustomerName(customerName), customerPhone, customerEmail),
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
    // 요청 바디는 CreatePaymentScheduleBody, 응답은 CreatePaymentScheduleResponse(={"schedule":{"id":...}})로
    // 공식 OpenAPI 스펙에서 확인함 — 아래 body.path("schedule") 폴백이 실제로 맞는 경로였다.
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
                                    new Customer(new CustomerName(customerName), customerPhone, customerEmail),
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

    // PortOne 공식 스키마(CustomerInput.name)는 "fullName"이 아니라 "name":{"full":...} 형태다 —
    // fullName으로 보내면 PortOne이 모르는 필드라 조용히 무시돼서 결제 자체는 되지만 고객 이름이 안 남았다.
    private record CustomerName(String full) {
    }

    private record Customer(CustomerName name, String phoneNumber, String email) {
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
