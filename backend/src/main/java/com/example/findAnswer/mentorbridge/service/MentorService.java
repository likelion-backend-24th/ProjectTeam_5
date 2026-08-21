package com.example.findAnswer.mentorbridge.service;

import com.example.findAnswer.mentorbridge.constants.MentorApplicationStatus;
import com.example.findAnswer.mentorbridge.constants.NotificationType;
import com.example.findAnswer.mentorbridge.constants.Role;
import com.example.findAnswer.mentorbridge.constants.SubscriptionStatus;
import com.example.findAnswer.mentorbridge.dto.mentor.MentorApplicationResponse;
import com.example.findAnswer.mentorbridge.dto.mentor.MentorResponse;
import com.example.findAnswer.mentorbridge.dto.mentor.MentorUpdateDto;
import com.example.findAnswer.mentorbridge.dto.user.UserResponse;
import com.example.findAnswer.mentorbridge.entity.MentorApplication;
import com.example.findAnswer.mentorbridge.entity.MentorProfile;
import com.example.findAnswer.mentorbridge.entity.User;
import com.example.findAnswer.mentorbridge.exception.CustomException;
import com.example.findAnswer.mentorbridge.constants.ErrorCode;
import com.example.findAnswer.mentorbridge.repository.MentorApplicationRepository;
import com.example.findAnswer.mentorbridge.repository.MentorPlanRepository;
import com.example.findAnswer.mentorbridge.repository.MentorReviewRepository;
import com.example.findAnswer.mentorbridge.repository.SubscriptionRepository;
import com.example.findAnswer.mentorbridge.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MentorService {
    private final MentorApplicationRepository mentorApplicationRepository;
    private final UserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final MentorPlanRepository mentorPlanRepository;
    private final MentorReviewRepository mentorReviewRepository;
    private final NotificationService notificationService;

    @Transactional
    public void applyForMentor(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        if (!user.isEmailVerified()) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }
        if (user.getRole() != Role.USER) {
            throw new CustomException(ErrorCode.VALIDATION_ERROR);
        }
        if (mentorApplicationRepository.existsByUser_IdAndStatus(userId, MentorApplicationStatus.PENDING)) {
            throw new CustomException(ErrorCode.VALIDATION_ERROR);
        }

        mentorApplicationRepository.save(
                MentorApplication.builder()
                        .user(user)
                        .introduction(null)
                        .careerSummary(null)
                        .build()
        );

        List<Long> adminIds = userRepository.findAllByRole(Role.ADMIN).stream().map(User::getId).toList();
        notificationService.notifyAll(adminIds, NotificationType.MENTOR_APPLICATION_SUBMITTED,
                user.getName() + "님이 멘토 신청을 보냈습니다.", "/admin");
    }

    @Transactional
    public void approveMentor(Long userId) {
        MentorApplication application = mentorApplicationRepository.findByUser_IdAndStatus(userId, MentorApplicationStatus.PENDING)
                .orElseThrow(() -> new CustomException(ErrorCode.RESOURCE_NOT_FOUND));
        application.approve();
        application.getUser().promoteToMentor();

        notificationService.notify(userId, NotificationType.MENTOR_APPROVED,
                "멘토 신청이 승인되었습니다.", "/profile");
    }

    @Transactional
    public void rejectMentor(Long userId) {
        MentorApplication application = mentorApplicationRepository.findByUser_IdAndStatus(userId, MentorApplicationStatus.PENDING)
                .orElseThrow(() -> new CustomException(ErrorCode.RESOURCE_NOT_FOUND));
        application.reject();

        notificationService.notify(userId, NotificationType.MENTOR_REJECTED,
                "멘토 신청이 거절되었습니다.", "/profile");
    }

    public MentorApplicationResponse getMyMentorApplication(Long userId) {
        MentorApplication application = mentorApplicationRepository.findFirstByUser_IdOrderByCreatedAtDesc(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.RESOURCE_NOT_FOUND));
        return new MentorApplicationResponse(application.getStatus(), application.getCreatedAt());
    }

    public List<UserResponse> getMentorApplications(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        if (user.getRole() != Role.ADMIN) {
            throw new CustomException(ErrorCode.VALIDATION_ERROR);
        }
        return mentorApplicationRepository.findByStatus(MentorApplicationStatus.PENDING).stream()
                .map(application -> UserResponse.from(application.getUser()))
                .toList();
    }

    // 활성 플랜이 있는 멘토 목록 조회 및 검색
    public Page<MentorResponse> getMentors(
            String keyword,
            Pageable pageable
    ) {
        List<SubscriptionStatus> activeStatuses = List.of(
                SubscriptionStatus.ACTIVE,
                SubscriptionStatus.CANCEL_RESERVED
        );

        LocalDateTime now = LocalDateTime.now();

        Page<User> mentors = userRepository.findActivePlanMentors(keyword, pageable);

        return mentors.map(user -> {
            long subscriberCount = subscriptionRepository.countByMentor_IdAndStatusInAndCurrentPeriodEndAfter(
                    user.getId(),
                    activeStatuses,
                    now
            );
            double rating = mentorReviewRepository.findAverageRatingByMentorId(user.getId());
            long reviewCount = mentorReviewRepository.countByMentor_Id(user.getId());

            return MentorResponse.from(
                    user,
                    (int) subscriberCount,
                    rating,
                    (int) reviewCount
            );
        });
    }

    public MentorResponse getMentorDetail(Long mentorId) {
        User user = userRepository.findById(mentorId)
                .orElseThrow(() -> new CustomException(ErrorCode.RESOURCE_NOT_FOUND));

        List<SubscriptionStatus> activeStatuses = List.of(SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCEL_RESERVED);
        LocalDateTime now = LocalDateTime.now();

        long subscriberCount = subscriptionRepository.countByMentor_IdAndStatusInAndCurrentPeriodEndAfter(
                mentorId, activeStatuses, now
        );
        double rating = mentorReviewRepository.findAverageRatingByMentorId(mentorId);
        long reviewCount = mentorReviewRepository.countByMentor_Id(mentorId);

        return MentorResponse.from(user, (int) subscriberCount, rating, (int) reviewCount);
    }

    @Transactional
    public MentorResponse updateMentorProfile(Long mentorId, MentorUpdateDto dto) {
        User user = userRepository.findById(mentorId)
                .orElseThrow(() -> new CustomException(ErrorCode.RESOURCE_NOT_FOUND));

        if (user.getMentorProfile() == null) {
            MentorProfile newProfile = MentorProfile.builder()
                    .user(user)
                    .bio(dto.getBio())
                    .company(dto.getCompany())
                    .career(dto.getCareer())
                    .tags(dto.getTags())
                    .education(dto.getEducation())
                    .schedule(dto.getSchedule())
                    .build();

            user.updateMentorProfile(newProfile);
            userRepository.save(user);
        } else {
            user.getMentorProfile().update(
                    dto.getBio(),
                    dto.getCompany(),
                    dto.getCareer(),
                    dto.getTags(),
                    dto.getEducation(),
                    dto.getSchedule(),
                    dto.getPortfolioUrl()
            );
        }

        List<SubscriptionStatus> activeStatuses = List.of(SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCEL_RESERVED);
        LocalDateTime now = LocalDateTime.now();
        long subscriberCount = subscriptionRepository.countByMentor_IdAndStatusInAndCurrentPeriodEndAfter(
                mentorId, activeStatuses, now
        );
        double rating = mentorReviewRepository.findAverageRatingByMentorId(mentorId);
        long reviewCount = mentorReviewRepository.countByMentor_Id(mentorId);

        return MentorResponse.from(user, (int) subscriberCount, rating, (int) reviewCount);
    }
}