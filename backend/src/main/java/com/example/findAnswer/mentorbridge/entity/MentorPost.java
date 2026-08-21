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

    @Column(name = "view_count", nullable = false)
    private long viewCount = 0;

    @Column(name = "like_count", nullable = false)
    private long likeCount = 0;

    @OneToMany(mappedBy = "mentorPost")
    private List<QuestionAttachmentFile> attachments = new ArrayList<>();

    @Builder
    public MentorPost(User mentor, String title, String content, String category, Boolean isPublic) {
        this.mentor = mentor;
        this.title = title;
        this.content = content;
        this.category = category != null ? category : "일반";
        this.isPublic = isPublic != null ? isPublic : true;
        this.viewCount = 0;
        this.likeCount = 0;
    }

    public void update(String title, String content, String category, Boolean isPublic) {
        this.title = title;
        this.content = content;
        if (category != null) this.category = category;
        if (isPublic != null) this.isPublic = isPublic;
    }

    public void increaseViewCount() {
        this.viewCount++;
    }

    public void increaseLikeCount() {
        this.likeCount++;
    }

    public void decreaseLikeCount() {
        if (this.likeCount > 0) {
            this.likeCount--;
        }
    }
}