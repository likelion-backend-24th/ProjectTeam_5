package com.example.findAnswer.mentorbridge.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "mentor_profiles")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MentorProfile extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "mentor_profile_id")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true, nullable = false)
    private User user;

    @Column(length = 1000)
    private String bio;

    @Column(length = 255)
    private String company;

    @Column(length = 255)
    private String career;

    @Column(length = 255)
    private String tags;

    @Column(length = 255)
    private String education;

    @Column(length = 255)
    private String schedule;

    @Column(length = 255)
    private String portfolioUrl;

    @Builder
    public MentorProfile(User user, String bio, String company, String career,
                         String tags, String education, String schedule, String portfolioUrl) {
        this.user = user;
        this.bio = bio;
        this.company = company;
        this.career = career;
        this.tags = tags;
        this.education = education;
        this.schedule = schedule;
        this.portfolioUrl = portfolioUrl;
    }

    public void update(String bio, String company, String career,
                       String tags, String education, String schedule, String portfolioUrl) {
        this.bio = bio;
        this.company = company;
        this.career = career;
        this.tags = tags;
        this.education = education;
        this.schedule = schedule;
        this.portfolioUrl = portfolioUrl;
    }
}