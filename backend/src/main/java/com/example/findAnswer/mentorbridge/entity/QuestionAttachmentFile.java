package com.example.findAnswer.mentorbridge.entity;

import com.example.findAnswer.mentorbridge.constants.AttachmentFileType;
import com.example.findAnswer.mentorbridge.constants.AttachmentStatus;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "question_attachment_files")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class QuestionAttachmentFile extends BaseTimeEntity{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id")
    private Question question;

    // 질문 첨부와 멘토 게시글 첨부가 이 엔티티 하나를 공유한다 — 둘 중 하나만 채워진다.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mentor_post_id")
    private MentorPost mentorPost;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "uploader_id")
    private User uploader;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AttachmentFileType attachmentType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AttachmentStatus attachmentStatus;

    @Column(nullable = false, length = 500, unique = true)
    private String storageKey;
    private String originalFileName;
    private Long size;

    public boolean isAttached() {
        return attachmentStatus == AttachmentStatus.ATTACHED;
    }

    public void attachedToQuestion(Question question) {
        this.question = question;
        this.attachmentStatus = AttachmentStatus.ATTACHED;
    }

    public void attachedToMentorPost(MentorPost mentorPost) {
        this.mentorPost = mentorPost;
        this.attachmentStatus = AttachmentStatus.ATTACHED;
    }

    public void detached() {
        this.question = null;
        this.mentorPost = null;
        this.attachmentStatus = AttachmentStatus.DELETED;
    }

    public boolean isOwnedBy(Long userId) {
        return this.uploader.getId().equals(userId);
    }

}
