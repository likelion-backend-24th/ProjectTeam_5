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

    // 둘 중 한쪽이 "채팅 종료"를 누르면 그 사람의 id가 들어간다. null이면 진행 중인 채팅.
    // 종료를 누른 사람 목록에서는 방을 숨기고, 상대방에게는 "종료된 채팅"으로 표시하되 이력은 유지한다.
    @Column(name = "ended_by")
    private Long endedBy;

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

    public boolean isEnded() {
        return endedBy != null;
    }

    public boolean isHiddenFor(Long userId) {
        return endedBy != null && endedBy.equals(userId);
    }

    public void endBy(Long userId) {
        this.endedBy = userId;
    }

    // 종료된 방에 다시 상담 신청이 들어오면(getOrCreateRoom 재사용) 양쪽 모두에게 다시 보이도록 되살린다.
    public void reactivate() {
        this.endedBy = null;
    }
}
