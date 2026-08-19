package com.example.findAnswer.mentorbridge.entity;

import com.example.findAnswer.mentorbridge.constants.Role;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = true, unique = true, length = 100)
    private String email;

    @Column(length = 255)
    private String password;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(length = 100)
    private String interests;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Role role;

    @Column(nullable = false)
    private boolean blocked = false;

    // 멘토 프로필 관련 필드들
    @Column(name = "profile_image_url")
    private String profileImageUrl;

    @Column(length = 1000)
    private String bio;

    @Column(length = 255)
    private String tags;


    @Column(length = 500)
    private String careers;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 100)
    private String location;

    @Column(length = 255)
    private String company;

    @Column(length = 255)
    private String career;

    @Column(length = 255)
    private String education;

    @Column(length = 255)
    private String schedule;

//    // 💡 [추가] 멘토 구독 월 이용료 필드
//    @Column(name = "subscription_price")
//    private Integer subscriptionPrice = 9900;

    @OneToMany(mappedBy = "user", cascade = CascadeType.REMOVE, orphanRemoval = true)
    private List<MentorApplication> mentorApplications = new ArrayList<>();

    public void updateProfile(String name, String interests) {
        this.name = name;
        this.interests = interests;
    }

    //공개 프로필 업데이트
    public void updatePublicProfile(String bio, String careers, String description, String location, String tags) {
        this.bio = bio;
        this.careers = careers;
        this.description = description;
        this.location = location;
        this.tags = tags;
    }

    //프로필 이미지 업데이트
    public void updateProfileImage(String profileImageUrl) {
        this.profileImageUrl = profileImageUrl;
    }

    //멘토 프로필 업데이트
    public void updateMentorProfile(String bio, String company, String career, String tags, String education, String schedule, Integer subscriptionPrice) {
        this.bio = bio;
        this.company = company;
        this.career = career;
        this.tags = tags;
        this.education = education;
        this.schedule = schedule;
        //this.subscriptionPrice = (subscriptionPrice != null) ? subscriptionPrice : 9900;
    }

    public void updatePassword(String encodedPassword) {
        this.password = encodedPassword;
    }

    public void updateEmail(String email) {
        this.email = email;
    }

    public void promoteToMentor() {
        this.role = Role.MENTOR;
    }

    public User(String email, String password, String name, Role role) {
        this.email = email;
        this.password = password;
        this.name = name;
        this.role = role;
    }

    public static User ofOAuth(String email, String name, Role role) {
        return new User(email, null, name, role);
    }

    public void block() {
        this.blocked = true;
    }

    public void unblock() {
        this.blocked = false;
    }

    public boolean isBlocked() {
        return this.blocked;
    }

}