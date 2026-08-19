package com.example.findAnswer.mentorbridge.service;

import com.example.findAnswer.mentorbridge.constants.AttachmentFileType;
import com.example.findAnswer.mentorbridge.constants.AttachmentStatus;
import com.example.findAnswer.mentorbridge.constants.ErrorCode;
import com.example.findAnswer.mentorbridge.dto.questionAttachedFile.SignRequest;
import com.example.findAnswer.mentorbridge.dto.questionAttachedFile.SignResponse;
import com.example.findAnswer.mentorbridge.dto.questionAttachedFile.SignedUpload;
import com.example.findAnswer.mentorbridge.entity.QuestionAttachmentFile;
import com.example.findAnswer.mentorbridge.entity.User;
import com.example.findAnswer.mentorbridge.exception.CustomException;
import com.example.findAnswer.mentorbridge.exception.UnsupportedFileTypeException;
import com.example.findAnswer.mentorbridge.repository.QuestionAttachmentFileRepository;
import com.example.findAnswer.mentorbridge.repository.UserRepository;
import com.example.findAnswer.mentorbridge.storage.AttachmentStorage;
import com.example.findAnswer.mentorbridge.storage.FileStorage;
import lombok.RequiredArgsConstructor;
import org.apache.tomcat.util.http.fileupload.InvalidFileNameException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AttachmentService {

    private final AttachmentStorage attachmentStorage;
    private final QuestionAttachmentFileRepository questionAttachmentFileRepository;
    private final UserRepository userRepository;
    private final FileStorage fileStorage;

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "gif", "webp");
    private static final long MAX_IMAGE_SIZE = 5 * 1024 * 1024;

    private static final Set<String> ALLOWED_FILE_EXTENSIONS = Set.of("pdf", "zip");
    private static final long MAX_FILE_SIZE = 50L * 1024 * 1024; // 50MB


    @Transactional
    public SignResponse createImageUploadSignature(Long userId, SignRequest signRequest){

        String extension = extractExtension(signRequest.filename());

        if(!ALLOWED_EXTENSIONS.contains(extension)){
            throw new UnsupportedFileTypeException(extension);
        }

        if(signRequest.fileSize() > MAX_IMAGE_SIZE){
            throw new CustomException(ErrorCode.FILE_TOO_LARGE);
        }

        User user = userRepository.findById(userId).orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        String storageKey = "findanswer/posts/"
            + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy/MM"))
            + "/" + UUID.randomUUID();

        QuestionAttachmentFile questionAttachmentFile = questionAttachmentFileRepository.save(
                QuestionAttachmentFile.builder()
                        .uploader(user)
                        .attachmentType(AttachmentFileType.IMAGE)
                        .attachmentStatus(AttachmentStatus.PENDING)
                        .storageKey(storageKey)
                        .originalFileName(signRequest.filename())
                        .size(signRequest.fileSize())
                        .build()
        );

        SignedUpload signedUpload = attachmentStorage.createSignedUpload(storageKey);

        return SignResponse.create(questionAttachmentFile.getId(), signedUpload);

    }


    public static String extractExtension(String filename) {
        if (filename == null) {
            throw new InvalidFileNameException(null, "파일명이 비어 있습니다");
        }

        // 경로 구분자 제거 — "../../etc/passwd" 같은 입력 차단
        String name = filename.replace('\\', '/');
        name = name.substring(name.lastIndexOf('/') + 1);

        int dot = name.lastIndexOf('.');

        if (dot < 0 || dot == name.length() - 1) {
            throw new InvalidFileNameException(filename, "확장자가 없습니다: " + filename);
        }

        return name.substring(dot + 1).toLowerCase(Locale.ROOT);
    }

}
