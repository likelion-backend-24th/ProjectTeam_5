package com.example.findAnswer.mentorbridge.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

// 멘토 리뷰(별점 + 코멘트). 유저당 멘토 한 명에게 리뷰 하나만 남길 수 있다(재작성은 update).
@Entity
@Table(
        name = "mentor_review",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_mentor_review_mentor_user", columnNames = {"mentor_id", "user_id"})
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MentorReview extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "mentor_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User mentor;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User user;

    @Column(nullable = false)
    private int rating; // 1~5

    @Column(length = 1000)
    private String comment;

    @Builder
    public MentorReview(User mentor, User user, int rating, String comment) {
        this.mentor = mentor;
        this.user = user;
        this.rating = rating;
        this.comment = comment;
    }

    public void update(int rating, String comment) {
        this.rating = rating;
        this.comment = comment;
    }

    public boolean isWrittenBy(Long userId) {
        return this.user.getId().equals(userId);
    }
}
