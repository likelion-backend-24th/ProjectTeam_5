package com.example.findAnswer.mentorbridge.entity;

import com.example.findAnswer.mentorbridge.constants.Role;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
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

    // 이메일 인증 여부
    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified = false;

    // 탈퇴 시각 (소프트 삭제 상태)
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "profile_image_url")
    private String profileImageUrl;

    // 카드 등록 시 받아서 저장 — 서버가 직접 트리거하는 결제(구독/정기결제)에 구매자 정보로 필요(이니시스 V2 필수값)
    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    // 멘토 프로필과 1:1 관계 설정 (정규화 유지)
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private MentorProfile mentorProfile;

    @OneToMany(mappedBy = "user", cascade = CascadeType.REMOVE, orphanRemoval = true)
    private List<MentorApplication> mentorApplications = new ArrayList<>();

    public void updateProfile(String name, String interests) {
        this.name = name;
        this.interests = interests;
    }

    // 프로필 이미지 업데이트
    public void updateProfileImage(String profileImageUrl) {
        this.profileImageUrl = profileImageUrl;
    }

    public void updatePhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
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

    public void verifyEmail() {
        this.emailVerified = true;
    }
    
    public void updateMentorProfile(MentorProfile mentorProfile) {
        this.mentorProfile = mentorProfile;
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

    public void softDelete() {
        this.deletedAt = LocalDateTime.now();
    }

    public boolean isDeleted() {
        return this.deletedAt != null;
    }
}