package com.example.findAnswer.dev.dto.user;

import com.example.findAnswer.dev.domain.Role;
import lombok.Getter;
import lombok.NoArgsConstructor;

//회원가입 요청
@Getter
@NoArgsConstructor
public class SignupRequest {

    private String email;
    private String password;
    private String name;
    private Role role;
}
