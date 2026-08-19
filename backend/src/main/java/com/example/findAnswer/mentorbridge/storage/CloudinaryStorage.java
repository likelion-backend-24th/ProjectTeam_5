package com.example.findAnswer.mentorbridge.storage;

import com.cloudinary.Cloudinary;
import com.cloudinary.Transformation;
import com.cloudinary.utils.ObjectUtils;
import com.example.findAnswer.mentorbridge.dto.questionAttachedFile.SignedUpload;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.time.Instant;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class CloudinaryStorage implements AttachmentStorage {

    private final Cloudinary cloudinary;

    @Override
    public SignedUpload createSignedUpload(String storageKey) {
        long timestamp = Instant.now().getEpochSecond();

        // SDK가 알파벳 정렬과 SHA-1 처리 — 직접 계산하지 않는다
        Map<String, Object> params = ObjectUtils.asMap(
                "public_id", storageKey,
                "timestamp", timestamp);

        String signature = cloudinary.apiSignRequest(params, cloudinary.config.apiSecret);

        return new SignedUpload(
                "https://api.cloudinary.com/v1_1/" + cloudinary.config.cloudName + "/image/upload",
                cloudinary.config.apiKey,
                timestamp,
                signature,
                storageKey);
    }

    @Override
    public void delete(String storageKey) {
        try {
            cloudinary.uploader().destroy(storageKey,
                    ObjectUtils.asMap("invalidate", true));   // CDN 캐시도 무효화
        } catch (IOException e) {
            throw new UncheckedIOException("Cloudinary 삭제 실패: " + storageKey, e);
        }
    }

    @Override
    public String publicUrl(String storageKey, String transformation) {
        return cloudinary.url()
                .transformation(new Transformation().rawTransformation(transformation))
                .generate(storageKey);
    }
}