package com.example.findAnswer.mentorbridge.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "mentor_post")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MentorPost extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mentor_id", nullable = false)
    private User mentor;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "category")
    private String category;

    @Column(name = "is_public", nullable = false)
    private Boolean isPublic = true;

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MentorPostAttachmentFile> attachments = new ArrayList<>();

    @Builder
    public MentorPost(User mentor, String title, String content, String category, Boolean isPublic) {
        this.mentor = mentor;
        this.title = title;
        this.content = content;
        this.category = category != null ? category : "일반";
        this.isPublic = isPublic != null ? isPublic : true;
    }

    public void addAttachment(MentorPostAttachmentFile attachment) {
        this.attachments.add(attachment);
        attachment.setPost(this);
    }

    public void update(String title, String content, String category, Boolean isPublic, List<MentorPostAttachmentFile> newAttachments) {
        this.title = title;
        this.content = content;
        if (category != null) this.category = category;
        if (isPublic != null) this.isPublic = isPublic;

        this.attachments.clear();
        if (newAttachments != null) {
            for (MentorPostAttachmentFile attachment : newAttachments) {
                this.addAttachment(attachment);
            }
        }
    }
}