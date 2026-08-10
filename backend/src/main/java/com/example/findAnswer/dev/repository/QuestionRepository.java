package com.example.findAnswer.dev.repository;

import com.example.findAnswer.dev.entity.Question;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {

    @EntityGraph(attributePaths = {"user"})
    Page<Question> findAll(Pageable pageable); // 등록된 전체 질문 최신순으로 조회

    //제목, 본문으로 질문 검색
    Page<Question> findByTitleContainingOrContentContaining(String title, String content , Pageable pageable);

    Page<Question> findByCategory(String category, Pageable pageable);
}
