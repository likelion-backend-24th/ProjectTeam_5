package com.example.findAnswer.dev.entity;

import com.example.findAnswer.dev.domain.Role;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.context.annotation.Profile;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User extends BaseTimeEntity{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)

    private Long id;

    @Column(name = "refresh_token")
    private String refreshToken;

    @Column(name = "mentor_approved")
    private boolean mentorApproved;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false, length = 255)
    private String password;

    @Column(nullable = false, length = 50)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Role role;

    public void updateProfile(String name) {this.name = name;}

    public void updatePassword(String encodedPassword) {this.password = encodedPassword;}

    public void updateEmail(String email) {this.email = email;}

    public void updateRefreshToken(String refreshToken) {this.refreshToken = refreshToken;}

    public void approveMentor() {this.mentorApproved = true;}

    public User(String email, String password, String name, Role role) {
        this.email = email;
        this.password = password;
        this.name = name;
        this.role = role;
        this.mentorApproved = false;
    }

}
