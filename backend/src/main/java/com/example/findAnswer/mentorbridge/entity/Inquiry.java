package com.example.findAnswer.mentorbridge.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "inquiries")
@Getter
@Setter
@NoArgsConstructor
public class Inquiry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String category; // 문의 유형 (일반문의, 신고 등)

    @Column(nullable = false)
    private String email;    // 회신 받을 이메일

    @Column(nullable = false)
    private String title;    // 제목

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;  // 내용

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now(); // 작성일

    @Column(nullable = false)
    private String status = "PENDING"; // 처리 상태 (PENDING: 대기중, RESOLVED: 완료)
}