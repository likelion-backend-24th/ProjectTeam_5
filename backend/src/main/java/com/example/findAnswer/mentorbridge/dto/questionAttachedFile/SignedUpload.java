package com.example.findAnswer.mentorbridge.dto.questionAttachedFile;

//Cloudinary 서명방식
public record SignedUpload(
        String uploadURL,
        String apiKey,
        long timestamp,
        String signature,
        String publicId
) {
}
