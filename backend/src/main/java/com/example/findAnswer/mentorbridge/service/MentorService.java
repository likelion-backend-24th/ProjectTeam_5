package com.example.findAnswer.mentorbridge.service;

import com.example.findAnswer.mentorbridge.constants.MentorApplicationStatus;
import com.example.findAnswer.mentorbridge.constants.Role;
import com.example.findAnswer.mentorbridge.dto.mentor.MentorApplicationResponse;
import com.example.findAnswer.mentorbridge.dto.mentor.MentorResponse;
import com.example.findAnswer.mentorbridge.dto.mentor.MentorUpdateDto;
import com.example.findAnswer.mentorbridge.dto.user.UserResponse;
import com.example.findAnswer.mentorbridge.entity.MentorApplication;
import com.example.findAnswer.mentorbridge.entity.User;
import com.example.findAnswer.mentorbridge.exception.CustomException;
import com.example.findAnswer.mentorbridge.constants.ErrorCode;
import com.example.findAnswer.mentorbridge.repository.MentorApplicationRepository;
import com.example.findAnswer.mentorbridge.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MentorService {
    private final MentorApplicationRepository mentorApplicationRepository;
    private final UserRepository userRepository;

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
        return userRepository.findMentors(keyword, pageable)
                .map(user -> new MentorResponse(
                        user.getId(),
                        user.getName(),
                        user.getProfileImageUrl(),
                        user.getBio(),
                        user.getTags(),
                        0.0,
                        0
                ));
    }

    // 멘토 상세 단건 조회
    public MentorResponse getMentorDetail(Long mentorId) {
        User user = userRepository.findById(mentorId)
                .orElseThrow(() -> new CustomException(ErrorCode.RESOURCE_NOT_FOUND));

        return MentorResponse.from(user);
    }

    // 멘토 프로필 수정
    @Transactional
    public MentorResponse updateMentorProfile(Long mentorId, MentorUpdateDto dto) {
        User user = userRepository.findById(mentorId)
                .orElseThrow(() -> new CustomException(ErrorCode.RESOURCE_NOT_FOUND));

        // 💡 record 방식(.bio()) 대신 Lombok Getter 방식(.getBio())으로 수정
        user.updateMentorProfile(
                dto.getBio(),
                dto.getCompany(),
                dto.getCareer(),
                dto.getTags(),
                dto.getEducation(),
                dto.getSchedule()
//                dto.getSubscriptionPrice()
        );

        return MentorResponse.from(user);
    }
}