package com.example.findAnswer.dev.dto.user;

import lombok.Getter;
import lombok.NoArgsConstructor;

//이메일 변경 요청
@Getter
@NoArgsConstructor
public class UserEmailUpdateRequest {

    private String email;
}
