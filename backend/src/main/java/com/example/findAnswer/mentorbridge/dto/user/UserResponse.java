package com.example.findAnswer.mentorbridge.dto.user;

import com.example.findAnswer.mentorbridge.domain.Role;
import com.example.findAnswer.mentorbridge.entity.User;
import lombok.Getter;

import java.time.LocalDateTime;

// 로그인/회원가입 성공시 유저 정보 응답
@Getter
public class UserResponse {

    private Long id;
    private String email;
    private String name;
    private String interests;
    private Role role;
    private LocalDateTime createdAt;


    public UserResponse() {}

    public UserResponse(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.name = user.getName();
        this.role = user.getRole();
        this.interests = user.getInterests();
        this.createdAt = user.getCreatedAt();
    }

    public static  UserResponse from(User user){

        UserResponse response = new UserResponse();
        response.id = user.getId();
        response.email = user.getEmail();
        response.name = user.getName();
        response.role = user.getRole();
        response.interests = user.getInterests();
        response.createdAt = user.getCreatedAt();
        return response;
    }
}
