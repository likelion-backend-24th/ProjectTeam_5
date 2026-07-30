package com.example.findAnswer.dev.dto.Answer;

import lombok.Getter;
import lombok.NoArgsConstructor;

//답변 작성 요청시 클라이언트로 전달
@Getter
@NoArgsConstructor
public class AnswerCreateRequest {

    private String content;
}
