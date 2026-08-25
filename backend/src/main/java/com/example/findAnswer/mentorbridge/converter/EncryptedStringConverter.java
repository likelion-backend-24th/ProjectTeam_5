package com.example.findAnswer.mentorbridge.converter;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * DB 컬럼을 AES-256-GCM으로 암호화해 저장한다. 계좌번호처럼 유출되면 곧바로 피해가 되는 값에 쓴다.
 *
 * <p>키는 환경변수 SETTLEMENT_ENCRYPTION_KEY(Base64 인코딩된 16/24/32바이트)로 준다.
 * 값이 없으면 애플리케이션이 뜨지 않는다 — 조용히 평문으로 저장되는 것보다 낫다.
 *
 * <p>키 생성:
 * <pre>openssl rand -base64 32</pre>
 *
 * <p>암호문에는 {@code enc:v1:} 접두사를 붙인다. 접두사가 없는 값은 암호화 도입 이전에 저장된
 * 평문으로 보고 그대로 읽는다. 그래야 기존 행을 한 번에 변환하지 않아도 서비스가 돌아간다
 * (해당 행은 다음에 저장될 때 자동으로 암호문이 된다).
 *
 * <p>Spring Boot가 Hibernate에 SpringBeanContainer를 등록하므로 이 컨버터는 스프링 빈으로 주입된다.
 */
@Slf4j
@Component
@Converter
public class EncryptedStringConverter implements AttributeConverter<String, String> {

    private static final String PREFIX = "enc:v1:";
    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int IV_LENGTH = 12;
    private static final int TAG_LENGTH_BITS = 128;

    private final SecretKey secretKey;
    private final SecureRandom random = new SecureRandom();

    public EncryptedStringConverter(
            @Value("${security.encryption.settlement-account-key:}") String base64Key) {

        if (base64Key == null || base64Key.isBlank()) {
            throw new IllegalStateException("""
                    계좌 암호화 키가 설정되지 않았습니다.
                    환경변수 SETTLEMENT_ENCRYPTION_KEY 에 Base64 키를 넣어주세요.
                    생성: openssl rand -base64 32
                    (IntelliJ는 실행 구성 > 환경 변수에 추가하면 됩니다.)""");
        }

        byte[] raw;
        try {
            raw = Base64.getDecoder().decode(base64Key.trim());
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException("SETTLEMENT_ENCRYPTION_KEY가 올바른 Base64가 아닙니다.", e);
        }
        if (raw.length != 16 && raw.length != 24 && raw.length != 32) {
            throw new IllegalStateException(
                    "SETTLEMENT_ENCRYPTION_KEY는 16/24/32바이트여야 합니다. 현재: " + raw.length + "바이트");
        }
        this.secretKey = new SecretKeySpec(raw, "AES");
    }

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null || attribute.isEmpty()) {
            return attribute;
        }
        try {
            byte[] iv = new byte[IV_LENGTH];
            random.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, new GCMParameterSpec(TAG_LENGTH_BITS, iv));
            byte[] cipherText = cipher.doFinal(attribute.getBytes(java.nio.charset.StandardCharsets.UTF_8));

            byte[] payload = ByteBuffer.allocate(iv.length + cipherText.length)
                    .put(iv).put(cipherText).array();

            return PREFIX + Base64.getEncoder().encodeToString(payload);
        } catch (Exception e) {
            throw new IllegalStateException("계좌 정보 암호화에 실패했습니다.", e);
        }
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isEmpty()) {
            return dbData;
        }
        // 암호화 도입 이전에 저장된 평문 행. 다음 저장 때 암호문으로 바뀐다.
        if (!dbData.startsWith(PREFIX)) {
            return dbData;
        }
        try {
            byte[] payload = Base64.getDecoder().decode(dbData.substring(PREFIX.length()));
            ByteBuffer buffer = ByteBuffer.wrap(payload);

            byte[] iv = new byte[IV_LENGTH];
            buffer.get(iv);
            byte[] cipherText = new byte[buffer.remaining()];
            buffer.get(cipherText);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, new GCMParameterSpec(TAG_LENGTH_BITS, iv));

            return new String(cipher.doFinal(cipherText), java.nio.charset.StandardCharsets.UTF_8);
        } catch (Exception e) {
            // 키가 바뀌었거나 데이터가 손상된 경우. 값 자체는 로그에 남기지 않는다.
            log.error("계좌 정보 복호화에 실패했습니다. 암호화 키가 바뀌지 않았는지 확인하세요.", e);
            throw new IllegalStateException("계좌 정보를 읽을 수 없습니다.", e);
        }
    }
}
