package com.example.findAnswer.mentorbridge.service;

import com.example.findAnswer.mentorbridge.constants.ErrorCode;
import com.example.findAnswer.mentorbridge.constants.Role;
import com.example.findAnswer.mentorbridge.dto.settlement.SettlementAccountRequest;
import com.example.findAnswer.mentorbridge.dto.settlement.SettlementAccountResponse;
import com.example.findAnswer.mentorbridge.entity.SettlementAccount;
import com.example.findAnswer.mentorbridge.entity.User;
import com.example.findAnswer.mentorbridge.exception.CustomException;
import com.example.findAnswer.mentorbridge.repository.SettlementAccountRepository;
import com.example.findAnswer.mentorbridge.repository.UserRepository;
import com.example.findAnswer.mentorbridge.webhook.BankAccountVerifier;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SettlementAccountService {

    private final SettlementAccountRepository settlementAccountRepository;
    private final UserRepository userRepository;
    private final BankAccountVerifier bankAccountVerifier;

    // 내 계좌 조회
    public SettlementAccountResponse getMyAccount(Long userId) {
        SettlementAccount account = settlementAccountRepository.findByUserId(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.SETTLEMENT_ACCOUNT_NOT_FOUND));
        return SettlementAccountResponse.from(account);
    }

    // 계좌 등록 및 수정 (없으면 생성, 있으면 덮어쓰기)
    @Transactional
    public SettlementAccountResponse saveOrUpdateAccount(Long userId, SettlementAccountRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        if (user.getRole() != Role.MENTOR && user.getRole() != Role.ADMIN) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }

        boolean isValid = bankAccountVerifier.verifyAccount(
                request.bankName(), request.accountNumber(), request.accountHolder()
        );
        if (!isValid) {
            throw new CustomException(ErrorCode.INVALID_ACCOUNT_INFO);
        }

        Optional<SettlementAccount> existingAccount = settlementAccountRepository.findByUserId(userId);

        SettlementAccount account;
        if (existingAccount.isPresent()) {
            account = existingAccount.get();
            account.update(request.bankName(), request.accountNumber(), request.accountHolder());
        } else {
            account = SettlementAccount.builder()
                    .user(user)
                    .bankName(request.bankName())
                    .accountNumber(request.accountNumber())
                    .accountHolder(request.accountHolder())
                    .build();
            settlementAccountRepository.save(account);
        }

        return SettlementAccountResponse.from(account);
    }
}