package com.example.findAnswer.mentorbridge.client.portone;


import tools.jackson.databind.JsonNode;

public record PortOnePaymentSnapshot(
        String paymentId,
        String status,
        Long amount,
        String currency,
        String storeId,
        String channelKey,
        String transactionId
) {

    private static String text(JsonNode node, String field) {
        JsonNode v = node.get(field);
        return (v == null || v.isNull()) ? null : v.asString();
    }

    public static PortOnePaymentSnapshot from(JsonNode body) {

        return new PortOnePaymentSnapshot(
                text(body, "id"),
                text(body, "status"),
                body.path("amount").path("total").asLong(0),
                text(body, "currency"),
                text(body, "storeId"),
                body.path("channel").path("key").asString(),
                text(body, "transactionId")
        );
    }



}
