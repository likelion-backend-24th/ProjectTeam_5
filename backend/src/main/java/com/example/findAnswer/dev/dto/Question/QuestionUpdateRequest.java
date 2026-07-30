package com.example.findAnswer.dev.dto.Question;

import lombok.Getter;
import lombok.NoArgsConstructor;

//질문 수정 요청시 클라이언트로부터 전달
@Getter
@NoArgsConstructor
public class QuestionUpdateRequest {

    private String title; //제목
    private String content; //본문
}
