package com.example.findAnswer.dev.entity;

import com.example.findAnswer.dev.domain.Role;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.context.annotation.Profile;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor
public class User extends BaseTimeEntity{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)

    private Long id; //사용자 PK

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

    public void updateRefreshToken(String refreshToken) {this.refreshToken = refreshToken;}

    public void approveMentor() {this.mentorApproved = true;}

    //enum으로 유로회원 role 추가 해서 User entity에 추가
}
