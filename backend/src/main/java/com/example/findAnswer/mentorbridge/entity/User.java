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

    @Column(name = "profile_image_url")
    private String profileImageUrl;

    // 멘토 프로필과 1:1 관계 설정
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private MentorProfile mentorProfile;

    @OneToMany(mappedBy = "user", cascade = CascadeType.REMOVE, orphanRemoval = true)
    private List<MentorApplication> mentorApplications = new ArrayList<>();

    public void updateProfile(String name, String interests) {
        this.name = name;
        this.interests = interests;
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

    public void block() { this.blocked = true; }
    public void unblock() { this.blocked = false; }
    public boolean isBlocked() { return this.blocked; }
}