package com.example.findAnswer.mentorbridge.service;

import com.example.findAnswer.mentorbridge.constants.ErrorCode;
import com.example.findAnswer.mentorbridge.constants.Role;
import com.example.findAnswer.mentorbridge.constants.SettlementStatus;
import com.example.findAnswer.mentorbridge.dto.settlement.SettlementResponse;
import com.example.findAnswer.mentorbridge.entity.Settlement;
import com.example.findAnswer.mentorbridge.entity.User;
import com.example.findAnswer.mentorbridge.exception.CustomException;
import com.example.findAnswer.mentorbridge.repository.SettlementRepository;
import com.example.findAnswer.mentorbridge.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SettlementService {

    private final SettlementRepository settlementRepository;
    private final UserRepository userRepository;

    public List<SettlementResponse> getMySettlements(Long mentorId) {
        User user = userRepository.findById(mentorId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        if (user.getRole() != Role.MENTOR) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }

        return settlementRepository.findByMentor_IdOrderByCreatedAtDesc(mentorId)
                .stream()
                .map(SettlementResponse::from)
                .toList();
    }

    public List<SettlementResponse> getAllSettlements() {
        return settlementRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(SettlementResponse::from)
                .toList();
    }

    @Transactional
    public void completeSettlement(Long settlementId) {
        Settlement settlement = settlementRepository.findById(settlementId)
                .orElseThrow(() -> new CustomException(ErrorCode.RESOURCE_NOT_FOUND));

        settlement.complete();
    }

    //멘토의 출금 신청 처리
    @Transactional
    public void requestWithdrawal(Long mentorId) {
        List<Settlement> pendingSettlements = settlementRepository.findByMentor_IdOrderByCreatedAtDesc(mentorId)
                .stream()
                .filter(s -> s.getStatus() == SettlementStatus.PENDING) // 대기 중인 것만 필터링
                .toList();

        if (pendingSettlements.isEmpty()) {
            throw new CustomException(ErrorCode.SETTLEMENT_REQUIRED); // "신청할 정산 금액이 없습니다." 처리
        }

        pendingSettlements.forEach(Settlement::requestWithdrawal);
    }
}

