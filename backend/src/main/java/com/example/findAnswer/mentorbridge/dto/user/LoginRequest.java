package com.example.findAnswer.mentorbridge.dto.user;

import lombok.Getter;
import lombok.NoArgsConstructor;

//로그인 요청
@Getter
@NoArgsConstructor
public class LoginRequest {

    private String email;
    private String password;
}
