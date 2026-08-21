package com.example.findAnswer.mentorbridge.dto.chat;

import java.time.LocalDateTime;

// 프론트가 "누구랑 채팅하는 방인지" 바로 표시할 수 있도록 상대방 이름까지 같이 내려준다.
public record ChatRoomResponse(
        Long chatRoomId,
        Long mentorId,
        String mentorName,
        Long subscriberId,
        String subscriberName,
        LocalDateTime createdAt,
        boolean ended
) {}
