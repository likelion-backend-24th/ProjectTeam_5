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
    public void createMentorPlan(MentorPlanRequest mentorPlanRequest) {

    }

    @Transactional
    public void updateMentorPlan(MentorPlanRequest mentorPlanRequest) {

    }
}
