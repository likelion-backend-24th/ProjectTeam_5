package com.example.findAnswer.dev.dto.user;

import com.example.findAnswer.dev.domain.Role;
import com.example.findAnswer.dev.entity.User;
import lombok.Getter;

// 로그인/회원가입 성공시 유저 정보 응답
@Getter
public class UserResponse {

    private Long id;
    private String email;
    private String name;
    private Role role;

    public static  UserResponse from(User user){

        UserResponse response = new UserResponse();
        response.id = user.getId();
        response.email = user.getEmail();
        response.name = user.getName();
        response.role = user.getRole();
        return response;
    }
}
