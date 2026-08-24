package com.example.findAnswer.mentorbridge.webhook;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class BankAccountVerifier {

    public boolean verifyAccount(String bankName, String accountNumber, String accountHolder) {
        // 계좌번호와 예금주 실명은 로그에 남기지 않는다. 로그는 보통 DB보다 오래 남고,
        // 이 둘이 함께 있으면 송금 지시를 위조하기에 충분한 정보가 된다.
        log.info("🔍 로컬 계좌 검증 시도 - 은행: {}, 계좌: {}", bankName, mask(accountNumber));

        if (bankName == null || bankName.isBlank() ||
                accountNumber == null || accountNumber.isBlank() ||
                accountHolder == null || accountHolder.isBlank()) {
            return false;
        }

        // 1. 계좌번호 자릿수 검사 (숫자만 추출 후 10자리 ~ 16자리 사이인지 확인)
        String cleanNumber = accountNumber.replaceAll("[^0-9]", "");
        if (cleanNumber.length() < 10 || cleanNumber.length() > 16) {
            log.warn("❌ 검증 실패: 계좌번호 자릿수가 올바르지 않습니다. (길이: {})", cleanNumber.length());
            return false;
        }

        // 2. 예금주명 자음/모음 분리 현상 검사 (예: 'ㄱㅗㅇ'처럼 낱자가 섞여있는지 확인)
        if (hasSeparatedJamo(accountHolder)) {
            log.warn("❌ 검증 실패: 예금주명에 자음 또는 모음이 분리되어 있습니다.");
            return false;
        }

        // 3. 예금주명 글자수 검사 (일반적으로 한국 이름은 2~10글자 내외)
        String trimmedHolder = accountHolder.trim();
        if (trimmedHolder.length() < 2 || trimmedHolder.length() > 10) {
            log.warn("❌ 검증 실패: 예금주명 길이가 올바르지 않습니다.");
            return false;
        }

        return true;
    }


    /** 로그용 마스킹 — 뒤 4자리만 남긴다. */
    private String mask(String accountNumber) {
        if (accountNumber == null || accountNumber.length() < 4) {
            return "****";
        }
        return "****" + accountNumber.substring(accountNumber.length() - 4);
    }

    private boolean hasSeparatedJamo(String text) {
        for (char c : text.toCharArray()) {
            // 한글 호환 자모 영역 (U+3131 ~ U+3163): 단독 자음 및 모음 (예: ㄱ, ㅡ 등)
            if (c >= '\u3131' && c <= '\u3163') {
                return true;
            }
        }
        return false;
    }
}