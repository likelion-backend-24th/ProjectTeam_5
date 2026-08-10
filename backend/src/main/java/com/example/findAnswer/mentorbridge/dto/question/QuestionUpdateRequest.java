package com.example.findAnswer.mentorbridge.dto.question;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

//질문 수정 요청시 클라이언트로부터 전달
@Getter
@NoArgsConstructor
public class QuestionUpdateRequest {

    @NotBlank(message = "제목은 필수 입력값입니다.")
    @Size(min = 1, max = 100, message = "제목은 1자 이상 100자 이하이어야 합니다.")
    private String title;

    @NotBlank(message = "본문은 필수 입력값입니다.")
    @Size(min = 1, max = 5000, message = "본문은 1자 이상 5000자 이하이어야 합니다.")
    private String content;

    @NotBlank(message = "카테고리는 필수 입력값입니다.")
    private String category;
}
