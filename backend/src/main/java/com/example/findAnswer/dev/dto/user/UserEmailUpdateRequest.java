package com.example.findAnswer.dev.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

//이메일 변경 요청
@Getter
@NoArgsConstructor
public class UserEmailUpdateRequest {

    @NotBlank(message = "변경할 이메일을 입력해주세요.")
    @Email(message = "올바른 이메일 형식이 아닙니다.")
    private String email;
}
