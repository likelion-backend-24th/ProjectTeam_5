package com.example.findAnswer.mentorbridge.service;

import com.example.findAnswer.mentorbridge.constants.ErrorCode;
import com.example.findAnswer.mentorbridge.constants.SubscriptionStatus;
import com.example.findAnswer.mentorbridge.dto.mentor.MentorReviewRequest;
import com.example.findAnswer.mentorbridge.dto.mentor.MentorReviewResponse;
import com.example.findAnswer.mentorbridge.entity.MentorReview;
import com.example.findAnswer.mentorbridge.entity.User;
import com.example.findAnswer.mentorbridge.exception.CustomException;
import com.example.findAnswer.mentorbridge.repository.MentorReviewRepository;
import com.example.findAnswer.mentorbridge.repository.SubscriptionRepository;
import com.example.findAnswer.mentorbridge.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

// 멘토 리뷰(별점 + 코멘트) — 그 멘토를 구독한 적 있는(현재/과거 무관) 유저만 남길 수 있다.
// 유저당 멘토 한 명에게 리뷰 하나만 유지되고, 다시 작성하면 기존 리뷰를 덮어쓴다(update).
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MentorReviewService {

    // PENDING(첫 결제 전)은 실제로 구독해본 적 없는 상태라 리뷰 자격에서 제외한다.
    private static final List<SubscriptionStatus> EVER_SUBSCRIBED_STATUSES =
            List.of(SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCEL_RESERVED,
                    SubscriptionStatus.EXPIRED, SubscriptionStatus.PAST_DUE);

    private final MentorReviewRepository mentorReviewRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;

    public List<MentorReviewResponse> getReviews(Long mentorId) {
        return mentorReviewRepository.findByMentor_IdOrderByCreatedAtDesc(mentorId)
                .stream()
                .map(MentorReviewResponse::from)
                .toList();
    }

    @Transactional
    public MentorReviewResponse createOrUpdateReview(Long userId, Long mentorId, MentorReviewRequest request) {
        if (userId.equals(mentorId)) {
            throw new CustomException(ErrorCode.INVALID_REQUEST);
        }

        boolean everSubscribed = subscriptionRepository
                .existsByUserIdAndMentor_IdAndStatusIn(userId, mentorId, EVER_SUBSCRIBED_STATUSES);
        if (!everSubscribed) {
            throw new AccessDeniedException("이 멘토를 구독한 적 있는 유저만 리뷰를 남길 수 있습니다.");
        }

        MentorReview review = mentorReviewRepository.findByMentor_IdAndUser_Id(mentorId, userId)
                .map(existing -> {
                    existing.update(request.rating(), request.comment());
                    return existing;
                })
                .orElseGet(() -> {
                    User mentor = getUserOrThrow(mentorId);
                    User user = getUserOrThrow(userId);
                    return mentorReviewRepository.save(
                            MentorReview.builder()
                                    .mentor(mentor)
                                    .user(user)
                                    .rating(request.rating())
                                    .comment(request.comment())
                                    .build()
                    );
                });

        return MentorReviewResponse.from(review);
    }

    @Transactional
    public void deleteReview(Long userId, Long reviewId) {
        MentorReview review = mentorReviewRepository.findById(reviewId)
                .orElseThrow(() -> new CustomException(ErrorCode.RESOURCE_NOT_FOUND));

        if (!review.isWrittenBy(userId)) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }

        mentorReviewRepository.delete(review);
    }

    private User getUserOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
    }
}
