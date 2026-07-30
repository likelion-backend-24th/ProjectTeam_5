package com.example.findAnswer.dev.dto.Question;

import lombok.Getter;
import lombok.NoArgsConstructor;

//질문 등록 요청시 클라이언트로부터 전달
@Getter
@NoArgsConstructor
public class QuestionCreateRequest {

    private String title; //제목
    private String content; //본문
}
