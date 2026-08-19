package com.example.findAnswer.mentorbridge.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "follows",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_follows_follower_followee", columnNames = {"follower_id", "followee_id"})
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Follow extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "follow_id") // 사진에 있는 PK 컬럼명 매핑
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "follower_id", nullable = false, foreignKey = @ForeignKey(name = "fk_follows_follower"))
    private User follower;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "followee_id", nullable = false, foreignKey = @ForeignKey(name = "fk_follows_followee"))
    private User followee;

    public Follow(User follower, User followee) {
        this.follower = follower;
        this.followee = followee;
    }
}