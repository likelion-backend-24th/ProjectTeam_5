package com.example.findAnswer.mentorbridge.service;

import com.example.findAnswer.mentorbridge.constants.ErrorCode;
import com.example.findAnswer.mentorbridge.constants.Role;
import com.example.findAnswer.mentorbridge.constants.SettlementStatus;
import com.example.findAnswer.mentorbridge.dto.settlement.SettlementAccountResponse;
import com.example.findAnswer.mentorbridge.dto.settlement.SettlementResponse;
import com.example.findAnswer.mentorbridge.entity.Settlement;
import com.example.findAnswer.mentorbridge.entity.SettlementAccount;
import com.example.findAnswer.mentorbridge.entity.User;
import com.example.findAnswer.mentorbridge.exception.CustomException;
import com.example.findAnswer.mentorbridge.repository.SettlementAccountRepository;
import com.example.findAnswer.mentorbridge.repository.SettlementRepository;
import com.example.findAnswer.mentorbridge.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SettlementService {

    private final SettlementRepository settlementRepository;
    private final UserRepository userRepository;
    private final SettlementAccountRepository settlementAccountRepository;

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

    /**
     * 관리자 정산 목록.
     * 관리자가 실제로 송금하려면 계좌가 필요하므로 멘토별 정산 계좌를 같이 내려준다.
     * 계좌는 멘토 id로 한 번에 모아서 조회한다(행마다 조회하면 N+1).
     */
    public List<SettlementResponse> getAllSettlements() {
        List<Settlement> settlements = settlementRepository.findAllByOrderByCreatedAtDesc();

        Set<Long> mentorIds = settlements.stream()
                .map(s -> s.getMentor().getId())
                .collect(Collectors.toSet());

        Map<Long, SettlementAccount> accountByMentorId = mentorIds.isEmpty()
                ? Map.of()
                : settlementAccountRepository.findByUserIdIn(mentorIds).stream()
                        .collect(Collectors.toMap(a -> a.getUser().getId(), Function.identity()));

        return settlements.stream()
                .map(s -> {
                    SettlementAccount account = accountByMentorId.get(s.getMentor().getId());
                    return SettlementResponse.from(
                            s, account == null ? null : SettlementAccountResponse.from(account));
                })
                .toList();
    }

    @Transactional
    public void completeSettlement(Long settlementId) {
        Settlement settlement = settlementRepository.findById(settlementId)
                .orElseThrow(() -> new CustomException(ErrorCode.RESOURCE_NOT_FOUND));

        // 관리자 화면의 disabled 속성이 유일한 방어선이면 안 된다.
        // API를 직접 호출하면 환불(CANCELED)된 건도 송금 완료가 됐고, 같은 호출을 반복해도 매번 성공했다.
        if (settlement.getStatus() != SettlementStatus.REQUESTED) {
            throw new CustomException(ErrorCode.SETTLEMENT_NOT_COMPLETABLE);
        }

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

