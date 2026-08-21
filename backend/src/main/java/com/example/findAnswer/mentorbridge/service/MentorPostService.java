package com.example.findAnswer.mentorbridge.service;

import com.example.findAnswer.mentorbridge.constants.ErrorCode;
import com.example.findAnswer.mentorbridge.dto.mentor.MentorPostRequest;
import com.example.findAnswer.mentorbridge.dto.mentor.MentorPostResponse;
import com.example.findAnswer.mentorbridge.entity.MentorPost;
import com.example.findAnswer.mentorbridge.entity.MentorPostAttachmentFile;
import com.example.findAnswer.mentorbridge.entity.User;
import com.example.findAnswer.mentorbridge.exception.CustomException;
import com.example.findAnswer.mentorbridge.repository.MentorPostRepository;
import com.example.findAnswer.mentorbridge.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MentorPostService {

    private final MentorPostRepository mentorPostRepository;
    private final UserRepository userRepository;
    private final SubscriptionService subscriptionService;

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

        if (request.attachments() != null) {
            for (MentorPostRequest.AttachmentRequest attachmentDto : request.attachments()) {
                MentorPostAttachmentFile attachment = MentorPostAttachmentFile.builder()
                        .storageKey(attachmentDto.storageKey())
                        .originalFileName(attachmentDto.originalFileName())
                        .size(attachmentDto.size())
                        .build();
                post.addAttachment(attachment);
            }
        }

        return MentorPostResponse.from(mentorPostRepository.save(post));
    }

    @Transactional
    public MentorPostResponse updatePost(Long mentorId, Long postId, MentorPostRequest request) {
        MentorPost post = mentorPostRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

        if (!post.getMentor().getId().equals(mentorId)) {
            throw new IllegalArgumentException("본인의 게시글만 수정할 수 있습니다.");
        }

        List<MentorPostAttachmentFile> newAttachments = null;
        if (request.attachments() != null) {
            newAttachments = request.attachments().stream()
                    .map(attachmentDto -> MentorPostAttachmentFile.builder()
                            .storageKey(attachmentDto.storageKey())
                            .originalFileName(attachmentDto.originalFileName())
                            .size(attachmentDto.size())
                            .build())
                    .toList();
        }

        post.update(
                request.title(),
                request.content(),
                request.category(),
                request.isPublic(),
                newAttachments
        );

        return MentorPostResponse.from(post);
    }

    @Transactional
    public void deletePost(Long mentorId, Long postId) {
        MentorPost post = mentorPostRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

        if (!post.getMentor().getId().equals(mentorId)) {
            throw new IllegalArgumentException("본인의 게시글만 삭제할 수 있습니다.");
        }

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

        return MentorPostResponse.from(post);
    }

    public List<MentorPostResponse> getPostsByMentorId(Long mentorId) {
        return mentorPostRepository.findByMentor_IdOrderByCreatedAtDesc(mentorId)
                .stream()
                .map(MentorPostResponse::from)
                .toList();
    }
}