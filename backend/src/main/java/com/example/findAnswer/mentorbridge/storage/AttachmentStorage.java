package com.example.findAnswer.mentorbridge.storage;


import com.example.findAnswer.mentorbridge.dto.questionAttachedFile.SignedUpload;

public interface AttachmentStorage {
    SignedUpload createSignedUpload(String storageKey);
    void delete(String storageKey);
    String publicUrl(String storageKey, String transform);
}
