package com.example.findAnswer.mentorbridge.service;

import com.example.findAnswer.mentorbridge.constants.ErrorCode;
import com.example.findAnswer.mentorbridge.dto.mentorPlan.MentorPlanRequest;
import com.example.findAnswer.mentorbridge.dto.mentorPlan.MentorPlanResponse;
import com.example.findAnswer.mentorbridge.entity.MentorPlan;
import com.example.findAnswer.mentorbridge.entity.User;
import com.example.findAnswer.mentorbridge.exception.CustomException;
import com.example.findAnswer.mentorbridge.repository.MentorPlanRepository;
import com.example.findAnswer.mentorbridge.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MentorPlanService {

    private final MentorPlanRepository mentorPlanRepository;
    private final UserRepository userRepository;

    public MentorPlanResponse getMentorPlanById(Long mentorPlanId) {
        MentorPlan plan = mentorPlanRepository.findById(mentorPlanId).orElseThrow(() -> new CustomException(ErrorCode.PLAN_NOT_FOUND));
        return MentorPlanResponse.fromEntity(plan);
    }

    public List<MentorPlanResponse> getAllMentorPlan() {
        List<MentorPlan> mentorPlans = mentorPlanRepository.findAll();
        return mentorPlans.stream().map(MentorPlanResponse::fromEntity).toList();
    }

    public List<MentorPlanResponse> getMentorPlanByMentor(Long mentorId) {
        List<MentorPlan> mentorPlans = mentorPlanRepository.findByMentor_IdAndIsActiveTrue(mentorId);
        return mentorPlans.stream().map(MentorPlanResponse::fromEntity).toList();
    }

    @Transactional
    public MentorPlanResponse createMentorPlan(Long mentorId, MentorPlanRequest request) {
        User mentor = userRepository.findById(mentorId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        MentorPlan plan = mentorPlanRepository.save(
                MentorPlan.builder()
                        .mentor(mentor)
                        .planName(request.planName())
                        .description(request.description())
                        .price(request.price())
                        .billingCycle(request.billingCycle())
                        .build()
        );
        return MentorPlanResponse.fromEntity(plan);
    }

    @Transactional
    public MentorPlanResponse updateMentorPlan(Long mentorId, Long mentorPlanId, MentorPlanRequest request) {
        MentorPlan plan = mentorPlanRepository.findById(mentorPlanId)
                .orElseThrow(() -> new CustomException(ErrorCode.PLAN_NOT_FOUND));

        if (!plan.isOwnedByMentor(mentorId)) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }

        plan.update(request.planName(), request.description(), request.price(), request.billingCycle());
        return MentorPlanResponse.fromEntity(plan);
    }

    @Transactional
    public void deleteMentorPlanById(Long mentorId, Long mentorPlanId) {
        MentorPlan plan = mentorPlanRepository.findById(mentorPlanId)
                .orElseThrow(() -> new CustomException(ErrorCode.PLAN_NOT_FOUND));

        if (!plan.isOwnedByMentor(mentorId)) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }

        plan.deactivate();
    }
}