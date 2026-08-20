package com.example.findAnswer.mentorbridge.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "chat_room", uniqueConstraints = @UniqueConstraint(columnNames = {"mentor_id", "subscriber_id"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ChatRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "mentor_id", nullable = false)
    private Long mentorId;

    @Column(name = "subscriber_id", nullable = false)
    private Long subscriberId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public ChatRoom(Long mentorId, Long subscriberId) {
        this.mentorId = mentorId;
        this.subscriberId = subscriberId;
        this.createdAt = LocalDateTime.now();
    }

    // 메시지 전송/조회 시 이 방의 당사자(멘토 본인 또는 구독자 본인)인지 확인하는 용도
    public boolean isParticipant(Long userId) {
        return mentorId.equals(userId) || subscriberId.equals(userId);
    }
}
