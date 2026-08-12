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

    public void detached() {
        this.question = null;
        this.attachmentStatus = AttachmentStatus.DELETED;
    }

    public boolean isOwnedBy(Long userId) {
        return this.uploader.getId().equals(userId);
    }

}
