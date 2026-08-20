package com.example.findAnswer.mentorbridge.dto.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// 메시지 전송 요청 바디. 빈 메시지 방지 + 길이 제한만 최소한으로 검증한다.
public record ChatMessageRequest(
        @NotBlank(message = "메시지 내용을 입력해주세요.")
        @Size(max = 2000, message = "메시지는 2000자를 넘을 수 없습니다.")
        String content
) {}
