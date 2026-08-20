package com.example.findAnswer.mentorbridge.webhook;


import com.example.findAnswer.mentorbridge.constants.ErrorCode;
import com.example.findAnswer.mentorbridge.exception.CustomException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;

// 서명 인증
@Component
public class PortOneWebhookVerifier {

    private static final long TOLERANCE_SECONDS = 300; // replay 공격 방지

    @Value("${portone.webhook-secret}")
    private String webhookSecret;

    public void verify(String webhookId, String webhookTimestamp, String webhookSignature, String rawBody) {

        validateTimestamp(webhookTimestamp);

        String signedContent = webhookId + "." + webhookTimestamp + "." + rawBody;
        String expected = computeSignature(signedContent);

        boolean matched = false;

        for (String part : webhookSignature.split(" ")){
            String signature = part.contains(",") ? part.substring(part.indexOf(",")+1) : part;
            if(constantTimeEquals(signature,expected)){
                matched = true;
                break;
            }
        }

        if(!matched){
            throw new CustomException(ErrorCode.WEBHOOK_SIGNATURE_INVALID);
        }

    }


    private void validateTimestamp(String webhookTimestamp) {
        try {
            long timestamp = Long.parseLong(webhookTimestamp);
            long now = Instant.now().getEpochSecond();

            if(Math.abs(now - timestamp) > TOLERANCE_SECONDS) {
                throw new CustomException(ErrorCode.WEBHOOK_SIGNATURE_INVALID);
            }
        } catch (NumberFormatException e) {
            throw new CustomException(ErrorCode.WEBHOOK_SIGNATURE_INVALID);
        }
    }

    private String computeSignature(String signedContent){
        try {
            String secretBase64 = webhookSecret.startsWith("whsec_") ? webhookSecret.substring("whsec_".length()) : webhookSecret;
            byte[] secretBytes = Base64.getDecoder().decode(secretBase64);

            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secretBytes, "HmacSHA256"));

            byte[] hash = mac.doFinal(signedContent.getBytes(StandardCharsets.UTF_8));

            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e){
            throw new CustomException(ErrorCode.WEBHOOK_SIGNATURE_INVALID);
        }
    }

    private boolean constantTimeEquals(String first, String second) {
        return MessageDigest.isEqual(first.getBytes(StandardCharsets.UTF_8), second.getBytes(StandardCharsets.UTF_8));
    }


}
