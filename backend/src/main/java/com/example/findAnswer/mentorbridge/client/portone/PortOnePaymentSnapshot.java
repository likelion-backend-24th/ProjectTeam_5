package com.example.findAnswer.mentorbridge.client.portone;

import com.fasterxml.jackson.databind.JsonNode;


public record PortOnePaymentSnapshot(
        String paymentId,
        String status,
        Long amount,
        String currency,
        String storeId,
        String channelKey,
        String transactionId
) {

    public static PortOnePaymentSnapshot from(JsonNode body) {
        return new PortOnePaymentSnapshot(
                body.get("id").asText(),
                body.get("status").asText(),
                body.path("amount").path("total").asLong(0),
                body.get("currency").asText(),
                body.get("storeId").asText(),
                body.path("channel").path("key").asText(),
                body.get("transactionId").asText()
        );
    }

}
