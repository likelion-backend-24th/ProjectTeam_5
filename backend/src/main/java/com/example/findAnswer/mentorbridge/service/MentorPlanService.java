package com.example.findAnswer.mentorbridge.service;

import com.example.findAnswer.mentorbridge.constants.ErrorCode;
import com.example.findAnswer.mentorbridge.dto.mentorPlan.MentorPlanRequest;
import com.example.findAnswer.mentorbridge.dto.mentorPlan.MentorPlanResponse;
import com.example.findAnswer.mentorbridge.entity.MentorPlan;
import com.example.findAnswer.mentorbridge.exception.CustomException;
import com.example.findAnswer.mentorbridge.repository.MentorPlanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MentorPlanService {

    private final MentorPlanRepository mentorPlanRepository;

    public MentorPlanResponse getMentorPlanById(Long mentorPlanId) {
        MentorPlan plan = mentorPlanRepository.findById(mentorPlanId).orElseThrow(() -> new CustomException(ErrorCode.PLAN_NOT_FOUND));
        return MentorPlanResponse.fromEntity(plan);
    }

    public List<MentorPlanResponse> getAllMentorPlan() {
        List<MentorPlan> mentorPlans = mentorPlanRepository.findAll();
        return mentorPlans.stream().map(MentorPlanResponse::fromEntity).toList();
    }

    public List<MentorPlanResponse> getMentorPlanByMentor(Long mentorId) {
        List<MentorPlan> mentorPlans = mentorPlanRepository.findByMentorIdAndIsActiveTrue(mentorId);
        return mentorPlans.stream().map(MentorPlanResponse::fromEntity).toList();
    }

    @Transactional
    public MentorPlanResponse createMentorPlan(Long mentorId, MentorPlanRequest request) {
        MentorPlan plan = mentorPlanRepository.save(
                MentorPlan.builder()
                        .mentorId(mentorId)
                        .planName(request.planName())
                        .description(request.description())
                        .price(request.price())
                        .billingCycle(request.billingCycle())
                        .isActive(true)
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
        // 더티 체킹
        return MentorPlanResponse.fromEntity(plan);
    }

    @Transactional
    public void deleteMentorPlanById(Long mentorId, Long mentorPlanId) {
        MentorPlan plan = mentorPlanRepository.findById(mentorPlanId)
                .orElseThrow(() -> new CustomException(ErrorCode.PLAN_NOT_FOUND));

        if (!plan.isOwnedByMentor(mentorId)) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }

        // 비활성화
        plan.deactivate();
    }
}
