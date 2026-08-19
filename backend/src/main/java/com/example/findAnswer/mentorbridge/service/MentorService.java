package com.example.findAnswer.mentorbridge.service;

import com.example.findAnswer.mentorbridge.constants.MentorApplicationStatus;
import com.example.findAnswer.mentorbridge.constants.Role;
import com.example.findAnswer.mentorbridge.constants.SubscriptionStatus; // 💡 추가
import com.example.findAnswer.mentorbridge.dto.mentor.MentorApplicationResponse;
import com.example.findAnswer.mentorbridge.dto.mentor.MentorResponse;
import com.example.findAnswer.mentorbridge.dto.mentor.MentorUpdateDto;
import com.example.findAnswer.mentorbridge.dto.user.UserResponse;
import com.example.findAnswer.mentorbridge.entity.MentorApplication;
import com.example.findAnswer.mentorbridge.entity.User;
import com.example.findAnswer.mentorbridge.exception.CustomException;
import com.example.findAnswer.mentorbridge.constants.ErrorCode;
import com.example.findAnswer.mentorbridge.repository.MentorApplicationRepository;
import com.example.findAnswer.mentorbridge.repository.SubscriptionRepository; // 💡 추가
import com.example.findAnswer.mentorbridge.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime; // 💡 추가
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MentorService {
    private final MentorApplicationRepository mentorApplicationRepository;
    private final UserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository; // 💡 1. SubscriptionRepository 주입 추가

    // 멘토 신청
    @Transactional
    public void applyForMentor(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        if (user.getRole() != Role.USER) {
            throw new CustomException(ErrorCode.VALIDATION_ERROR);
        }
        if (mentorApplicationRepository.existsByUser_IdAndStatus(userId, MentorApplicationStatus.PENDING)) {
            throw new CustomException(ErrorCode.VALIDATION_ERROR);
        }
        mentorApplicationRepository.save(new MentorApplication(user));
    }

    // 멘토 승인
    @Transactional
    public void approveMentor(Long userId) {
        MentorApplication application = mentorApplicationRepository.findByUser_IdAndStatus(userId, MentorApplicationStatus.PENDING)
                .orElseThrow(() -> new CustomException(ErrorCode.RESOURCE_NOT_FOUND));
        application.approve();
        application.getUser().promoteToMentor();
    }

    // 멘토 거절
    @Transactional
    public void rejectMentor(Long userId) {
        MentorApplication application = mentorApplicationRepository.findByUser_IdAndStatus(userId, MentorApplicationStatus.PENDING)
                .orElseThrow(() -> new CustomException(ErrorCode.RESOURCE_NOT_FOUND));
        application.reject();
    }

    // 내 멘토 신청 상태 조회
    public MentorApplicationResponse getMyMentorApplication(Long userId) {
        MentorApplication application = mentorApplicationRepository.findFirstByUser_IdOrderByCreatedAtDesc(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.RESOURCE_NOT_FOUND));
        return new MentorApplicationResponse(application.getStatus(), application.getCreatedAt());
    }

    // 멘토 신청 목록 조회 (관리자용)
    public List<UserResponse> getMentorApplications(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        if (user.getRole() != Role.ADMIN) {
            throw new CustomException(ErrorCode.VALIDATION_ERROR);
        }
        return mentorApplicationRepository.findByStatus(MentorApplicationStatus.PENDING).stream()
                .map(application -> UserResponse.from(application.getUser()))
                .toList();
    }

    // 멘토 목록 조회 및 검색
    public Page<MentorResponse> getMentors(String keyword, Pageable pageable) {
        List<SubscriptionStatus> activeStatuses = List.of(SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCEL_RESERVED);
        LocalDateTime now = LocalDateTime.now();

        return userRepository.findMentors(keyword, pageable)
                .map(user -> {
                    // 💡 2. 각 멘토별 활성 구독자 수 카운트 조회
                    long subscriberCount = subscriptionRepository.countByMentorIdAndStatusInAndCurrentPeriodEndAfter(
                            user.getId(), activeStatuses, now
                    );

                    // 💡 3. 구독자 수를 반영한 MentorResponse 생성
                    return MentorResponse.from(user, (int) subscriberCount);
                });
    }

    // 멘토 상세 단건 조회
    public MentorResponse getMentorDetail(Long mentorId) {
        User user = userRepository.findById(mentorId)
                .orElseThrow(() -> new CustomException(ErrorCode.RESOURCE_NOT_FOUND));

        List<SubscriptionStatus> activeStatuses = List.of(SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCEL_RESERVED);
        LocalDateTime now = LocalDateTime.now();

        // 💡 4. 상세 조회 시에도 실제 구독자 수 카운트 후 전달
        long subscriberCount = subscriptionRepository.countByMentorIdAndStatusInAndCurrentPeriodEndAfter(
                mentorId, activeStatuses, now
        );

        return MentorResponse.from(user, (int) subscriberCount);
    }

    // 멘토 프로필 수정
    @Transactional
    public MentorResponse updateMentorProfile(Long mentorId, MentorUpdateDto dto) {
        User user = userRepository.findById(mentorId)
                .orElseThrow(() -> new CustomException(ErrorCode.RESOURCE_NOT_FOUND));

        user.updateMentorProfile(
                dto.getBio(),
                dto.getCompany(),
                dto.getCareer(),
                dto.getTags(),
                dto.getEducation(),
                dto.getSchedule()
//                dto.getSubscriptionPrice()
        );

        List<SubscriptionStatus> activeStatuses = List.of(SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCEL_RESERVED);
        LocalDateTime now = LocalDateTime.now();
        long subscriberCount = subscriptionRepository.countByMentorIdAndStatusInAndCurrentPeriodEndAfter(
                mentorId, activeStatuses, now
        );

        return MentorResponse.from(user, (int) subscriberCount);
    }
}