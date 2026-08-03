package com.example.findAnswer.dev.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "answers")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Answer extends BaseTimeEntity{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)

    private Long id; //답변 PK

    @ManyToOne(fetch = FetchType.LAZY) // 여러개 답변이 하나의 질문에 등록 가능
    @JoinColumn(name = "question_id", nullable = false)
    private Question question; // 질문 정보

    @ManyToOne(fetch = FetchType.LAZY) // 여러개 답변을 한명의 유저가 작성 가능
    @JoinColumn(name = "user_id", nullable = false)
    private User user; // 답변 작성자 정보

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    // 답변 수정
    public void update(String content) {
        this.content = content;
    }

    @Builder
    public Answer(Question question, User user, String content) {
        this.question = question;
        this.user = user;
        this.content = content;
    }
}
