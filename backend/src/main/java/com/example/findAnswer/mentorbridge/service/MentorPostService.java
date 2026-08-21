package com.example.findAnswer.mentorbridge.service;

import com.example.findAnswer.mentorbridge.constants.AttachmentFileType;
import com.example.findAnswer.mentorbridge.constants.ErrorCode;
import com.example.findAnswer.mentorbridge.dto.mentor.MentorPostRequest;
import com.example.findAnswer.mentorbridge.dto.mentor.MentorPostResponse;
import com.example.findAnswer.mentorbridge.dto.question.ImageResponse;
import com.example.findAnswer.mentorbridge.dto.questionAttachedFile.FileResponse;
import com.example.findAnswer.mentorbridge.entity.MentorPost;
import com.example.findAnswer.mentorbridge.entity.QuestionAttachmentFile;
import com.example.findAnswer.mentorbridge.entity.User;
import com.example.findAnswer.mentorbridge.exception.CustomException;
import com.example.findAnswer.mentorbridge.repository.MentorPostRepository;
import com.example.findAnswer.mentorbridge.repository.QuestionAttachmentFileRepository;
import com.example.findAnswer.mentorbridge.repository.UserRepository;
import com.example.findAnswer.mentorbridge.storage.AttachmentStorage;
import com.example.findAnswer.mentorbridge.storage.FileStorage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MentorPostService {

    private static final String IMAGE_TRANSFORM = "f_auto,q_auto";

    private final MentorPostRepository mentorPostRepository;
    private final UserRepository userRepository;
    private final SubscriptionService subscriptionService;
    private final QuestionAttachmentFileRepository questionAttachmentFileRepository;
    private final AttachmentStorage attachmentStorage;
    private final FileStorage fileStorage;

    @Transactional
    public MentorPostResponse createPost(Long mentorId, MentorPostRequest request) {
        User mentor = userRepository.findById(mentorId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        MentorPost post = MentorPost.builder()
                .mentor(mentor)
                .title(request.title())
                .content(request.content())
                .category(request.category())
                .isPublic(request.isPublic())
                .build();

        MentorPost savedPost = mentorPostRepository.save(post);

        List<QuestionAttachmentFile> attached = new ArrayList<>();
        List<Long> attachmentIds = request.attachmentIds();
        if (attachmentIds != null) {
            for (Long attachmentId : attachmentIds) {
                QuestionAttachmentFile file = questionAttachmentFileRepository.findById(attachmentId)
                        .orElseThrow(() -> new CustomException(ErrorCode.RESOURCE_NOT_FOUND));

                if (!file.isOwnedBy(mentorId)) {
                    throw new CustomException(ErrorCode.ACCESS_DENIED);
                }

                file.attachedToMentorPost(savedPost);
                attached.add(file);
            }
        }

        return MentorPostResponse.from(savedPost, imagesOf(attached), filesOf(attached));
    }

    @Transactional
    public MentorPostResponse updatePost(Long mentorId, Long postId, MentorPostRequest request) {
        MentorPost post = mentorPostRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

        if (!post.getMentor().getId().equals(mentorId)) {
            throw new IllegalArgumentException("본인의 게시글만 수정할 수 있습니다.");
        }

        post.update(request.title(), request.content(), request.category(), request.isPublic());

        List<QuestionAttachmentFile> current = questionAttachmentFileRepository.findByMentorPost(post);
        Set<Long> editFile = new HashSet<>(request.attachmentIds() != null ? request.attachmentIds() : List.of());
        Set<Long> currentFile = current.stream().map(QuestionAttachmentFile::getId).collect(java.util.stream.Collectors.toSet());

        List<QuestionAttachmentFile> lastFiles = new ArrayList<>();
        for (QuestionAttachmentFile file : current) {
            if (editFile.contains(file.getId())) {
                lastFiles.add(file);
            } else {
                deleteAttachmentBlob(file);
                questionAttachmentFileRepository.delete(file);
            }
        }

        for (Long attachmentId : editFile) {
            if (currentFile.contains(attachmentId)) {
                continue;
            }

            QuestionAttachmentFile file = questionAttachmentFileRepository.findById(attachmentId)
                    .orElseThrow(() -> new CustomException(ErrorCode.RESOURCE_NOT_FOUND));

            if (!file.isOwnedBy(mentorId)) {
                throw new CustomException(ErrorCode.ACCESS_DENIED);
            }

            file.attachedToMentorPost(post);
            lastFiles.add(file);
        }

        return MentorPostResponse.from(post, imagesOf(lastFiles), filesOf(lastFiles));
    }

    @Transactional
    public void deletePost(Long mentorId, Long postId) {
        MentorPost post = mentorPostRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

        if (!post.getMentor().getId().equals(mentorId)) {
            throw new IllegalArgumentException("본인의 게시글만 삭제할 수 있습니다.");
        }

        List<QuestionAttachmentFile> attachments = questionAttachmentFileRepository.findByMentorPost(post);
        for (QuestionAttachmentFile file : attachments) {
            deleteAttachmentBlob(file);
        }
        questionAttachmentFileRepository.deleteAll(attachments);

        mentorPostRepository.delete(post);
    }

    public MentorPostResponse getPost(Long userId, Long mentorId, Long postId) {
        MentorPost post = mentorPostRepository.findByIdAndMentor_Id(postId, mentorId)
                .orElseThrow(() -> new CustomException(ErrorCode.POST_NOT_FOUND));

        if (Boolean.FALSE.equals(post.getIsPublic())) {

            if (userId == null) {
                throw new CustomException(ErrorCode.SUBSCRIPTION_REQUIRED);
            }

            if (!userId.equals(mentorId)) {
                var accessInfo = subscriptionService.checkAccessPermission(userId, mentorId);
                if (!accessInfo.accessAllowed()) {
                    throw new CustomException(ErrorCode.SUBSCRIPTION_REQUIRED);
                }
            }
        }

        List<QuestionAttachmentFile> attachments = questionAttachmentFileRepository.findByMentorPost(post);
        return MentorPostResponse.from(post, imagesOf(attachments), filesOf(attachments));
    }

    public List<MentorPostResponse> getPostsByMentorId(Long mentorId) {
        return mentorPostRepository.findByMentor_IdOrderByCreatedAtDesc(mentorId)
                .stream()
                .map(post -> {
                    List<QuestionAttachmentFile> attachments = questionAttachmentFileRepository.findByMentorPost(post);
                    return MentorPostResponse.from(post, imagesOf(attachments), filesOf(attachments));
                })
                .toList();
    }

    private List<ImageResponse> imagesOf(List<QuestionAttachmentFile> files) {
        return files.stream()
                .filter(QuestionAttachmentFile::isAttached)
                .filter(f -> f.getAttachmentType() == AttachmentFileType.IMAGE)
                .map(f -> new ImageResponse(f.getId(),
                        attachmentStorage.publicUrl(f.getStorageKey(), IMAGE_TRANSFORM)))
                .toList();
    }

    private List<FileResponse> filesOf(List<QuestionAttachmentFile> files) {
        return files.stream()
                .filter(QuestionAttachmentFile::isAttached)
                .filter(f -> f.getAttachmentType() == AttachmentFileType.FILE)
                .map(f -> new FileResponse(f.getId(), f.getOriginalFileName(), f.getSize(),
                        "/api/attachments/files/" + f.getId() + "/download"))
                .toList();
    }

    // 이미지는 Cloudinary, 일반 파일은 로컬 디스크에 저장돼서 삭제 방식이 다르다.
    private void deleteAttachmentBlob(QuestionAttachmentFile file) {
        try {
            if (file.getAttachmentType() == AttachmentFileType.IMAGE) {
                attachmentStorage.delete(file.getStorageKey());
            } else {
                fileStorage.delete(file.getStorageKey());
            }
        } catch (RuntimeException e) {
            log.warn("첨부파일 삭제 실패(무시하고 진행): storageKey={}", file.getStorageKey(), e);
        }
    }
}
