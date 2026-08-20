package com.example.findAnswer.mentorbridge.util;

import java.util.UUID;

// 이니시스 oid(주문번호) 제한이 1~40자라 UUID(36자)를 접두어와 함께 그대로 못 쓴다.
public final class ShortId {

    private ShortId() {
    }

    // 하이픈 뺀 UUID 앞 20자(80bit) — paymentId/issueId 접두어를 붙여도 40자 제한에 여유 있게 들어간다.
    public static String generate() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 20);
    }
}
