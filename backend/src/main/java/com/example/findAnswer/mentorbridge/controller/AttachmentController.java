package com.example.findAnswer.mentorbridge.controller;

import com.example.findAnswer.mentorbridge.dto.questionAttachedFile.DownloadFile;
import com.example.findAnswer.mentorbridge.dto.questionAttachedFile.FileUploadResponse;
import com.example.findAnswer.mentorbridge.dto.questionAttachedFile.SignRequest;
import com.example.findAnswer.mentorbridge.dto.questionAttachedFile.SignResponse;
import com.example.findAnswer.mentorbridge.dto.questionAttachedFile.SignedUpload;
import com.example.findAnswer.mentorbridge.service.AttachmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.net.URLEncoder;

@RestController
@RequestMapping("/api/attachments")
@RequiredArgsConstructor
public class AttachmentController {

    private final AttachmentService attachmentService;

    @PostMapping("/images/signature")
    public ResponseEntity<SignResponse> createImageSignature(
            @AuthenticationPrincipal Long currentUserId,
            @Valid
            @RequestBody SignRequest request

    ) {
        return ResponseEntity.ok(attachmentService.createImageUploadSignature(currentUserId, request));
    }

    @PostMapping("/profile-image/signature")
    public ResponseEntity<SignedUpload> createProfileImageSignature(@AuthenticationPrincipal Long currentUserId) {
        return ResponseEntity.ok(attachmentService.createProfileImageSignature(currentUserId));
    }

    // 이미지와 달리 서명 후 직접 업로드가 아니라, 파일 자체를 우리 서버로 보낸다(서버가 로컬 디스크에 저장).
    @PostMapping(value = "/files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<FileUploadResponse> uploadFile(
            @AuthenticationPrincipal Long currentUserId,
            @RequestParam("file") MultipartFile file
    ) {
        return ResponseEntity.ok(attachmentService.uploadFile(currentUserId, file));
    }

    @GetMapping("/files/{attachId}/download")
    public ResponseEntity<Resource> downloadFile(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long attachId
    ) {
        DownloadFile download = attachmentService.downloadFile(currentUserId, attachId);

        String encodedFilename = URLEncoder.encode(download.originalFileName(), StandardCharsets.UTF_8)
                .replace("+", "%20");

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(download.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + encodedFilename)
                .body(download.resource());
    }
}
