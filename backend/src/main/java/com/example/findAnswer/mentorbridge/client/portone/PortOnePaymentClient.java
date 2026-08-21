package com.example.findAnswer.mentorbridge.client.portone;

import com.example.findAnswer.mentorbridge.constants.ErrorCode;
import com.example.findAnswer.mentorbridge.exception.CustomException;
import lombok.extern.slf4j.Slf4j;
import org.springdoc.api.ErrorMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import tools.jackson.databind.JsonNode;


@Slf4j
@Component
public class PortOnePaymentClient {

    @Value("${portone.api-base-url}")
    private String apiBaseUrl;

    @Value("${portone.store-id}")
    private String storeId;

    @Value("${portone.api-secret}")
    private String apiSecret;

    private final RestClient restClient = RestClient.create();

    public PortOnePaymentSnapshot getPayment(String paymentId) {
        try{


            JsonNode body = restClient.get()
                    .uri(apiBaseUrl + "/payments/{paymentId}?storeId={storeId}", paymentId, storeId)
                    .header("Authorization", "PortOne " + apiSecret)
                    .retrieve()
                    .body(JsonNode.class);

            if(body == null){
                log.info(paymentId);
                throw new CustomException(ErrorCode.PAYMENT_VERIFICATION_FAILED);
            }
            return PortOnePaymentSnapshot.from(body);

        } catch (RestClientResponseException e){
            log.warn("PortOne 결제 조회 실패 {} : {}", paymentId, e.getMessage());
            throw new CustomException(ErrorCode.PAYMENT_VERIFICATION_FAILED);
        }
    }

    // 결제 취소(환불). POST /payments/{paymentId}/cancel — reason 필수, amount 생략 시 전액 취소.
    // storeId는 스펙상 선택(미입력 시 API Secret의 상점 아이디를 씀)이지만, getPayment()처럼 명시적으로 보낸다 —
    // 계정에 상점이 여러 개면 storeId 없이는 결제가 다른 상점 소속으로 조회돼 PAYMENT_NOT_FOUND가 날 수 있다.
    public void cancelPayment(String paymentId, String reason) {
        try {
            restClient.post()
                    .uri(apiBaseUrl + "/payments/{paymentId}/cancel", paymentId)
                    .header("Authorization", "PortOne " + apiSecret)
                    .body(new CancelRequest(reason, storeId))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException e) {
            log.warn("PortOne 결제 취소 실패 {} : {}", paymentId, e.getMessage());
            throw new CustomException(ErrorCode.PAYMENT_CANCEL_FAILED);
        }
    }

    private record CancelRequest(String reason, String storeId) {
    }

}
