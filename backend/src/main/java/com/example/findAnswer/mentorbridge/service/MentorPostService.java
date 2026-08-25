package com.example.findAnswer.mentorbridge.service;

import com.example.findAnswer.mentorbridge.constants.AttachmentFileType;
import com.example.findAnswer.mentorbridge.constants.ErrorCode;
import com.example.findAnswer.mentorbridge.dto.mentor.MentorPostRequest;
import com.example.findAnswer.mentorbridge.dto.mentor.MentorPostResponse;
import com.example.findAnswer.mentorbridge.dto.question.ImageResponse;
import com.example.findAnswer.mentorbridge.dto.questionAttachedFile.FileResponse;
import com.example.findAnswer.mentorbridge.entity.*;
import com.example.findAnswer.mentorbridge.exception.CustomException;
import com.example.findAnswer.mentorbridge.repository.*;
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
    private final MentorPostLikeRepository mentorPostLikeRepository;
    private final MentorPostViewLogRepository viewLogRepository;

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

        return MentorPostResponse.from(savedPost, imagesOf(attached), filesOf(attached), false, savedPost.getLikeCount());
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

        // attachmentIds가 없으면 "첨부는 건드리지 않는다"는 뜻으로 해석한다.
        // (예전에는 빈 목록으로 취급해서, 제목만 고쳐도 첨부 행은 물론 Cloudinary 원본까지 지워졌다.)
        if (request.attachmentIds() == null) {
            return MentorPostResponse.from(post, imagesOf(current), filesOf(current), false, post.getLikeCount());
        }

        Set<Long> editFile = new HashSet<>(request.attachmentIds());
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

        return MentorPostResponse.from(post, imagesOf(lastFiles), filesOf(lastFiles), false, post.getLikeCount());
    }

    @Transactional
    public void deletePost(Long mentorId, Long postId) {
        MentorPost post = mentorPostRepository.findById(postId)
                .orElseThrow(() -> new CustomException(ErrorCode.POST_NOT_FOUND));

        if (!post.getMentor().getId().equals(mentorId)) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }

        List<QuestionAttachmentFile> attachments = questionAttachmentFileRepository.findByMentorPost(post);
        for (QuestionAttachmentFile file : attachments) {
            deleteAttachmentBlob(file);
        }
        questionAttachmentFileRepository.deleteAll(attachments);

        // 좋아요·조회 로그가 게시글을 참조하고 있어서, 먼저 지우지 않으면 FK 제약 위반으로 500이 난다.
        mentorPostLikeRepository.deleteByMentorPostId(postId);
        viewLogRepository.deleteByPostId(postId);
        mentorPostLikeRepository.flush();
        viewLogRepository.flush();

        mentorPostRepository.delete(post);
    }

    /** 유료(비공개) 글을 읽을 수 있는가 — 멘토 본인이거나 유효한 구독자. */
    private boolean canReadPaidContent(Long userId, Long mentorId) {
        if (userId == null) {
            return false;
        }
        if (userId.equals(mentorId)) {
            return true;
        }
        return subscriptionService.checkAccessPermission(userId, mentorId).accessAllowed();
    }

    private void requireReadable(MentorPost post, Long userId, Long mentorId) {
        if (Boolean.TRUE.equals(post.getIsPublic())) {
            return;
        }
        if (!canReadPaidContent(userId, mentorId)) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }
    }


    @Transactional
    public MentorPostResponse getPost(Long userId, Long mentorId, Long postId) {
        MentorPost post = mentorPostRepository.findByIdAndMentor_Id(postId, mentorId)
                .orElseThrow(() -> new CustomException(ErrorCode.POST_NOT_FOUND));

        requireReadable(post, userId, mentorId);

        // 로그인하지 않은 요청은 조회수를 올리지 않는다.
        // (예전에는 else 분기에서 무조건 올려서, 헤더 없이 curl을 반복하면 조회수를 무한히 부풀릴 수 있었다.)
        if (userId != null && !viewLogRepository.existsByUserIdAndPostId(userId, postId)) {
            post.increaseViewCount();
            viewLogRepository.save(new MentorPostViewLog(userId, postId));
        }

        boolean liked = (userId != null) && mentorPostLikeRepository.existsByUserIdAndMentorPostId(userId, postId);
        List<QuestionAttachmentFile> attachments = questionAttachmentFileRepository.findByMentorPost(post);

        return MentorPostResponse.from(post, imagesOf(attachments), filesOf(attachments), liked, post.getLikeCount());
    }

    /**
     * 비공개(구독자 전용) 글은 본문을 빼고 내려준다.
     * 예전에는 목록에 검사가 아예 없어서, 화면의 🔒 자물쇠와 무관하게 유료 글 본문이 그대로 실려 나갔다.
     */
    public List<MentorPostResponse> getPostsByMentorId(Long userId, Long mentorId) {
        boolean canReadPaid = canReadPaidContent(userId, mentorId);

        return mentorPostRepository.findByMentor_IdOrderByCreatedAtDesc(mentorId)
                .stream()
                .map(post -> {
                    boolean readable = canReadPaid || Boolean.TRUE.equals(post.getIsPublic());
                    boolean liked = (userId != null)
                            && mentorPostLikeRepository.existsByUserIdAndMentorPostId(userId, post.getId());

                    if (!readable) {
                        return MentorPostResponse.locked(post, liked);
                    }

                    List<QuestionAttachmentFile> attachments = questionAttachmentFileRepository.findByMentorPost(post);
                    return MentorPostResponse.from(post, imagesOf(attachments), filesOf(attachments), liked, post.getLikeCount());
                })
                .toList();
    }

    @Transactional
    public void likePost(Long userId, Long mentorId, Long postId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        MentorPost post = mentorPostRepository.findByIdAndMentor_Id(postId, mentorId)
                .orElseThrow(() -> new CustomException(ErrorCode.POST_NOT_FOUND));

        if (!mentorPostLikeRepository.existsByUserIdAndMentorPostId(userId, postId)) {
            mentorPostLikeRepository.save(new MentorPostLike(user, post));
            post.increaseLikeCount();
        }
    }

    @Transactional
    public void unlikePost(Long userId, Long mentorId, Long postId) {
        MentorPost post = mentorPostRepository.findByIdAndMentor_Id(postId, mentorId)
                .orElseThrow(() -> new CustomException(ErrorCode.POST_NOT_FOUND));

        if (mentorPostLikeRepository.existsByUserIdAndMentorPostId(userId, postId)) {
            mentorPostLikeRepository.deleteByUserIdAndMentorPostId(userId, postId);
            post.decreaseLikeCount();
        }
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