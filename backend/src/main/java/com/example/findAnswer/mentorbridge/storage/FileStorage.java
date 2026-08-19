package com.example.findAnswer.mentorbridge.storage;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

public interface FileStorage {
    void store(MultipartFile file, String storageKey);
    Resource loadAsResource(String storageKey);
    void delete(String storageKey);
}