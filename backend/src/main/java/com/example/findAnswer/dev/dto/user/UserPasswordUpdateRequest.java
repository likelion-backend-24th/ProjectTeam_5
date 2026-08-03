package com.example.findAnswer.dev.dto.user;

import lombok.Getter;
import lombok.NoArgsConstructor;

//비밀번호 변경 요청
@Getter
@NoArgsConstructor
public class UserPasswordUpdateRequest {

    private String currentPassword;
    private String newPassword;
}
