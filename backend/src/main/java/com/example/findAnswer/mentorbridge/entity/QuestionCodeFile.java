package com.example.findAnswer.mentorbridge.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "question_code_files")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class QuestionCodeFile extends BaseTimeEntity{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false) // optional=false , 필수란 소리
    @JoinColumn(name = "question_id")
    private Question question;

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false)
    private String language; // 확장자에서 가져오기

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    private Integer sortOrder;

}
