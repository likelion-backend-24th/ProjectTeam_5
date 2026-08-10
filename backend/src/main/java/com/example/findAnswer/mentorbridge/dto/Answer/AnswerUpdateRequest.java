package com.example.findAnswer.mentorbridge.dto.Answer;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

//답변 수정 요청시 클라이언트로 전달
@Getter
@NoArgsConstructor
public class AnswerUpdateRequest {

    @NotBlank(message = "답변 내용은 필수 입력값입니다.")
    @Size(min = 1, max = 2000, message = "답변은 1자 이상 2000자 이하이어야 합니다.")
    private String content;
}
