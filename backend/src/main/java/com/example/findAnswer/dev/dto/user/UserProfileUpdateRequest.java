package com.example.findAnswer.dev.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

//프로필 수정 요청
@Getter
@NoArgsConstructor
public class UserProfileUpdateRequest {

    @NotBlank(message = "이름은 필수 입력값입니다.")
    @Size(min = 1, max = 20, message = "이름은 1자 이상 20자 이하이어야 합니다.")
    private String name;
}
