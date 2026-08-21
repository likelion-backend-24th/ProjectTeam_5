package com.example.findAnswer.mentorbridge.service;

import com.example.findAnswer.mentorbridge.constants.AttachmentFileType;
import com.example.findAnswer.mentorbridge.constants.AttachmentStatus;
import com.example.findAnswer.mentorbridge.constants.ErrorCode;
import com.example.findAnswer.mentorbridge.dto.questionAttachedFile.DownloadFile;
import com.example.findAnswer.mentorbridge.dto.questionAttachedFile.FileUploadResponse;
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
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Map;
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

    public SignedUpload createProfileImageSignature(Long userId) {

        String storageKey = "findanswer/profiles/user_" + userId + "_" + Instant.now().getEpochSecond();
        return attachmentStorage.createSignedUpload(storageKey);
    }

    private static final Map<String, String> FILE_CONTENT_TYPES = Map.of(
            "pdf", "application/pdf",
            "zip", "application/zip"
    );

    // 이미지와 달리 Cloudinary로 직접 업로드하는 방식이 아니라, 파일 바이트를 우리 서버가 받아서 로컬 디스크에 저장한다.
    @Transactional
    public FileUploadResponse uploadFile(Long userId, MultipartFile file) {
        String originalFilename = file.getOriginalFilename();
        String extension = extractExtension(originalFilename);

        if (!ALLOWED_FILE_EXTENSIONS.contains(extension)) {
            throw new UnsupportedFileTypeException(extension);
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new CustomException(ErrorCode.FILE_TOO_LARGE);
        }

        User user = userRepository.findById(userId).orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        String storageKey = "findanswer/files/"
                + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy/MM"))
                + "/" + UUID.randomUUID() + "." + extension;

        fileStorage.store(file, storageKey);

        QuestionAttachmentFile attachment = questionAttachmentFileRepository.save(
                QuestionAttachmentFile.builder()
                        .uploader(user)
                        .attachmentType(AttachmentFileType.FILE)
                        .attachmentStatus(AttachmentStatus.PENDING)
                        .storageKey(storageKey)
                        .originalFileName(originalFilename)
                        .size(file.getSize())
                        .build()
        );

        return new FileUploadResponse(attachment.getId(), attachment.getOriginalFileName(), attachment.getSize());
    }

    public DownloadFile downloadFile(Long currentUserId, Long attachId) {
        QuestionAttachmentFile attachment = questionAttachmentFileRepository.findById(attachId)
                .orElseThrow(() -> new CustomException(ErrorCode.FILE_NOT_FOUND));

        if (!canDownload(currentUserId, attachment)) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }

        Resource resource = fileStorage.loadAsResource(attachment.getStorageKey());
        String extension = extractExtension(attachment.getOriginalFileName());
        String contentType = FILE_CONTENT_TYPES.getOrDefault(extension, "application/octet-stream");

        return new DownloadFile(resource, attachment.getOriginalFileName(), contentType);
    }

    // 업로더 본인은 항상 접근 가능. 질문 게시판은 전체 공개라 첨부도 공개다(질문에 붙은 상태일 때만 — PENDING/DELETED는 아직
    // 공개 콘텐츠가 아니므로 제외). 멘토 게시글 첨부는 그 게시글의 공개 여부(isPublic)를 그대로 따른다.
    private boolean canDownload(Long userId, QuestionAttachmentFile attachment) {
        if (attachment.isOwnedBy(userId)) {
            return true;
        }
        if (!attachment.isAttached()) {
            return false;
        }
        if (attachment.getQuestion() != null) {
            return true;
        }
        if (attachment.getMentorPost() != null) {
            return Boolean.TRUE.equals(attachment.getMentorPost().getIsPublic());
        }
        return false;
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
