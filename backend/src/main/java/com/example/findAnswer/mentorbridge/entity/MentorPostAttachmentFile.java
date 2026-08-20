package com.example.findAnswer.mentorbridge.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "mentor_post_attachment_files")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class MentorPostAttachmentFile extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private MentorPost post;

    @Column(nullable = false, length = 500)
    private String storageKey; // 파일 저장 경로 또는 식별자

    @Column(nullable = false)
    private String originalFileName;

    @Column(nullable = false)
    private Long size;

    // MentorPost와의 연관관계 편의 메서드
    public void setPost(MentorPost post) {
        this.post = post;
        if (post != null && !post.getAttachments().contains(this)) {
            post.getAttachments().add(this);
        }
    }
}