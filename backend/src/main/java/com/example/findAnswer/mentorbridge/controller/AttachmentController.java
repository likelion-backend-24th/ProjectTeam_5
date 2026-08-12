package com.example.findAnswer.mentorbridge.controller;

import com.example.findAnswer.mentorbridge.dto.questionAttachedFile.SignRequest;
import com.example.findAnswer.mentorbridge.dto.questionAttachedFile.SignResponse;
import com.example.findAnswer.mentorbridge.service.AttachmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

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
}
