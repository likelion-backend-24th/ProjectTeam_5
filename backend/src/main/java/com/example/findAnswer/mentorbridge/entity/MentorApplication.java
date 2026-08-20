package com.example.findAnswer.mentorbridge.entity;

import com.example.findAnswer.mentorbridge.constants.MentorApplicationStatus;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "mentor_applications")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MentorApplication extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "mentor_application_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MentorApplicationStatus status;

    // 💡 [추가] 멘토 지원 시 제출한 내용 (심사 이력 보존용 스냅샷)
    @Column(columnDefinition = "TEXT")
    private String introduction;

    @Column(length = 255)
    private String careerSummary;

    @Builder
    public MentorApplication(User user, String introduction, String careerSummary) {
        this.user = user;
        this.introduction = introduction;
        this.careerSummary = careerSummary;
        this.status = MentorApplicationStatus.PENDING;
    }

    public void approve() {
        this.status = MentorApplicationStatus.APPROVED;
    }

    public void reject() {
        this.status = MentorApplicationStatus.REJECTED;
    }
}