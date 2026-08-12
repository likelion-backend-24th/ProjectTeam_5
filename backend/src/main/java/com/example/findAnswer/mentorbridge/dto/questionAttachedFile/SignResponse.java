package com.example.findAnswer.mentorbridge.dto.questionAttachedFile;

public record SignResponse(
        Long attachId,
        String uploadURL,
        String apiKey,
        long timestamp,
        String signature,
        String publicId
) {
    public static SignResponse create(Long attachId, SignedUpload signedUpload){
        return new SignResponse(
                attachId,
                signedUpload.uploadURL(),
                signedUpload.apiKey(),
                signedUpload.timestamp(),
                signedUpload.signature(),
                signedUpload.publicId()
        );
    }
}
