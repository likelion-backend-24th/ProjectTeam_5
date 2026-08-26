package com.example.findAnswer.mentorbridge.service;

import com.example.findAnswer.mentorbridge.constants.ErrorCode;
import com.example.findAnswer.mentorbridge.dto.mentor.MentorPostCommentCreateRequest;
import com.example.findAnswer.mentorbridge.dto.mentor.MentorPostCommentResponse;
import com.example.findAnswer.mentorbridge.entity.MentorPostComment;
import com.example.findAnswer.mentorbridge.entity.User;
import com.example.findAnswer.mentorbridge.exception.CustomException;
import com.example.findAnswer.mentorbridge.repository.MentorPostCommentRepository;
import com.example.findAnswer.mentorbridge.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MentorPostCommentService {

    private final MentorPostCommentRepository mentorPostCommentRepository;
    private final UserRepository userRepository;

    public List<MentorPostCommentResponse> getComments(Long postId) {
        return mentorPostCommentRepository.findByPostIdOrderByCreatedAtAsc(postId)
                .stream()
                .map(comment -> {
                    String authorName = userRepository.findById(comment.getUserId())
                            .map(User::getName)
                            .orElse("익명");
                    return MentorPostCommentResponse.from(comment, authorName);
                })
                .toList();
    }

    @Transactional
    public MentorPostCommentResponse createComment(Long postId, Long userId, MentorPostCommentCreateRequest request) {
        MentorPostComment comment = MentorPostComment.builder()
                .postId(postId)
                .userId(userId)
                .content(request.getContent())
                .build();

        MentorPostComment savedComment = mentorPostCommentRepository.save(comment);

        String authorName = userRepository.findById(userId)
                .map(User::getName)
                .orElse("익명");

        return MentorPostCommentResponse.from(savedComment, authorName);
    }

    @Transactional
    public void deleteComment(Long commentId, Long userId) {
        MentorPostComment comment = mentorPostCommentRepository.findById(commentId)
                .orElseThrow(() -> new CustomException(ErrorCode.RESOURCE_NOT_FOUND));

        if (!comment.getUserId().equals(userId)) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }

        mentorPostCommentRepository.delete(comment);
    }
}