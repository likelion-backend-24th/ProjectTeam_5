package com.example.findAnswer.mentorbridge.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "mentor_post")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MentorPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "mentor_id", nullable = false)
    private Long mentorId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    // 💡 [추가] 첨부파일 ID 목록 관리 (별도 테이블 매핑 또는 단순 컬렉션)
    @ElementCollection
    @CollectionTable(name = "mentor_post_attachments", joinColumns = @JoinColumn(name = "post_id"))
    @Column(name = "attachment_id")
    private List<Long> attachmentIds = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Builder
    public MentorPost(Long mentorId, String title, String content, List<Long> attachmentIds) {
        this.mentorId = mentorId;
        this.title = title;
        this.content = content;
        this.attachmentIds = attachmentIds != null ? attachmentIds : new ArrayList<>();
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public void update(String title, String content, List<Long> attachmentIds) {
        this.title = title;
        this.content = content;
        if (attachmentIds != null) {
            this.attachmentIds = attachmentIds;
        }
        this.updatedAt = LocalDateTime.now();
    }
}