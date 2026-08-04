package com.example.findAnswer.dev.service;

import com.example.findAnswer.dev.dto.Question.QuestionCreateRequest;
import com.example.findAnswer.dev.dto.Question.QuestionListResponse;
import com.example.findAnswer.dev.dto.Question.QuestionResponse;
import com.example.findAnswer.dev.dto.Question.QuestionUpdateRequest;
import com.example.findAnswer.dev.entity.Question;
import com.example.findAnswer.dev.entity.User;
import com.example.findAnswer.dev.repository.QuestionRepository;
import com.example.findAnswer.dev.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final UserRepository userRepository;

    //질문 등록
    @Transactional
    public QuestionResponse createQuestion(Long userId, QuestionCreateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));

        Question question = Question.builder()
                .user(user)
                .title(request.getTitle())
                .content(request.getContent())
                .build();

        Question savedQuestion = questionRepository.save(question);
        return QuestionResponse.from(savedQuestion);
    }

    // 질문 상세 조회 (답변 목록 포함)
    public QuestionResponse getQuestion(Long questionId) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 질문입니다."));
        return QuestionResponse.from(question);
    }

    // 질문 전체 목록 조회 (페이징)
    public Page<QuestionListResponse> getQuestions(Pageable pageable) {
        return questionRepository.findAll(pageable)
                .map(QuestionListResponse::from);
    }

    // 질문 검색 (제목 + 본문 통합 검색, 페이징)
    public Page<QuestionListResponse> searchQuestions(String keyword, Pageable pageable) {
        return questionRepository.findByTitleContainingOrContentContaining(keyword, keyword, pageable)
                .map(QuestionListResponse::from);
    }

    // 질문 수정 (작성자 본인 검증)
    @Transactional
    public QuestionResponse updateQuestion(Long questionId, Long userId, QuestionUpdateRequest request) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 질문입니다."));

        validateAuthor(question.getUser().getId(), userId);
        question.update(request.getTitle(), request.getContent());
        return QuestionResponse.from(question);
    }

    // 질문 삭제 (작성자 본인 검증)
    @Transactional
    public void deleteQuestion(Long questionId, Long userId) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 질문입니다."));

        validateAuthor(question.getUser().getId(), userId);
        questionRepository.delete(question);
    }

    //권한 예외처리
    private void validateAuthor(Long authorId, Long currentUserId) {
        if (!authorId.equals(currentUserId)) {
            throw new IllegalStateException("해당 게시글에 대한 권한이 없습니다.");
        }
    }
}
