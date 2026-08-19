package com.example.findAnswer.mentorbridge.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "mentor_plan")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class MentorPlan extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "mentor_id", nullable = false)
    private Long mentorId;

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

    public void deactivate() {
        this.isActive = false;
    }

    public boolean isOwnedByMentor(Long mentorId) {
        return this.mentorId.equals(mentorId);
    }


}
