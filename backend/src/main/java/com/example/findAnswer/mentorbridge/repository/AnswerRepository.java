package com.example.findAnswer.mentorbridge.repository;

import com.example.findAnswer.mentorbridge.entity.Answer;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AnswerRepository extends JpaRepository<Answer, Long> {

    @EntityGraph(attributePaths = {"user"})
    List<Answer> findByQuestionIdOrderByCreatedAtAsc(Long questionId);// 특정 질문 ID에 속한 답변 목록들 조회
}
