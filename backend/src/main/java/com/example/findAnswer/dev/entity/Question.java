package com.example.findAnswer.dev.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "questions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Question extends BaseTimeEntity{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)

    private Long id; //질문 게시글 PK

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true) //질문이 삭제될때 답변들도 함께 삭제
    private List<Answer> answers = new ArrayList<>();

    //질문 수정
    public void update(String title, String content) {
        this.title = title;
        this.content = content;
    }

    @Builder
    public Question(User user, String title, String content) {
        this.user = user;
        this.title = title;
        this.content = content;
    }
}
