package com.example.findAnswer.mentorbridge.repository;

import com.example.findAnswer.mentorbridge.entity.Question;
import com.example.findAnswer.mentorbridge.entity.QuestionAttachmentFile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestionAttachmentFileRepository extends JpaRepository<QuestionAttachmentFile, Long> {

    // 특정 질문에 연결된 첨부 전체 (삭제/조회용)
    List<QuestionAttachmentFile> findByQuestion(Question question);
}
