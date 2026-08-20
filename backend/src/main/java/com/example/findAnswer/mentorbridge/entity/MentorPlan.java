package com.example.findAnswer.mentorbridge.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "mentor_plan")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MentorPlan extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mentor_id", nullable = false)
    private User mentor;

    @Column(nullable = false, length = 50)
    private String planName;

    @Column(nullable = false, length = 500)
    private String description;

    @Column(nullable = false)
    private Integer price;

    @Column(name = "billing_cycle", nullable = false)
    private int billingCycle;

    @Column(name = "is_active", nullable = false)
    private boolean isActive;

    @Builder
    public MentorPlan(User mentor, String planName, String description, Integer price, int billingCycle) {
        this.mentor = mentor;
        this.planName = planName;
        this.description = description;
        this.price = price;
        this.billingCycle = billingCycle;
        this.isActive = true;
    }

    public void deactivate() {
        this.isActive = false;
    }

    public boolean isOwnedByMentor(Long mentorId) {
        return this.mentor.getId().equals(mentorId);
    }

    public void update(String planName, String description, Integer price, int billingCycle) {
        this.planName = planName;
        this.description = description;
        this.price = price;
        this.billingCycle = billingCycle;
    }
}