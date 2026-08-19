package com.example.findAnswer.mentorbridge.client.portone;

import com.example.findAnswer.mentorbridge.constants.ErrorCode;
import com.example.findAnswer.mentorbridge.exception.CustomException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import com.fasterxml.jackson.databind.JsonNode;


@Slf4j
@Component
public class PortOnePaymentClient {

    @Value("${portone.api-base-url}")
    private String apiBaseUrl;

    @Value("${portone.api-secret}")
    private String apiSecret;

    private final RestClient restClient = RestClient.create();

    public PortOnePaymentSnapshot getPayment(String paymentId) {
        try{
            JsonNode body = restClient.get()
                    .uri(apiBaseUrl + "/payments/{paymentId}", paymentId)
                    .header("Authorization", "PortOne " + apiSecret)
                    .retrieve()
                    .body(JsonNode.class);

            if(body == null){
                throw new CustomException(ErrorCode.PAYMENT_VERIFICATION_FAILED);
            }
            return PortOnePaymentSnapshot.from(body);

        } catch (RestClientResponseException e){
            log.warn("PortOne 결제 조회 실패 {} : {}", paymentId, e.getMessage());
            throw new CustomException(ErrorCode.PAYMENT_VERIFICATION_FAILED);
        }
    }




}
