package com.example.findAnswer.dev.service;

import com.example.findAnswer.dev.dto.Question.QuestionCreateRequest;
import com.example.findAnswer.dev.dto.Question.QuestionListResponse;
import com.example.findAnswer.dev.dto.Question.QuestionResponse;
import com.example.findAnswer.dev.dto.Question.QuestionUpdateRequest;
import com.example.findAnswer.dev.entity.Question;
import com.example.findAnswer.dev.entity.User;
import com.example.findAnswer.dev.domain.Role;
import com.example.findAnswer.dev.exception.CustomException;
import com.example.findAnswer.dev.exception.ErrorCode;
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

    // 질문 등록
    @Transactional
    public QuestionResponse createQuestion(Long userId, QuestionCreateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        Question question = Question.builder()
                .user(user)
                .title(request.getTitle())
                .content(request.getContent())
                .category(request.getCategory())
                .build();

        Question savedQuestion = questionRepository.save(question);
        return QuestionResponse.from(savedQuestion);
    }

    // 질문 상세 조회 (답변 목록 포함)
    public QuestionResponse getQuestion(Long questionId) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new CustomException(ErrorCode.QUESTION_NOT_FOUND));
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

    //카테고리별 조회
    @Transactional(readOnly = true)
    public Page<QuestionListResponse> getQuestionsByCategory(String category, Pageable pageable) {
        if (category == null || category.equals("전체")) {
            return questionRepository.findAll(pageable).map(QuestionListResponse::from);
        }
        return questionRepository.findByCategory(category, pageable).map(QuestionListResponse::from);
    }

    // 질문 수정 (작성자 본인만 가능)
    @Transactional
    public QuestionResponse updateQuestion(Long questionId, Long userId, QuestionUpdateRequest request) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new CustomException(ErrorCode.QUESTION_NOT_FOUND));

        validateAuthor(question.getUser().getId(), userId);
        question.update(request.getTitle(), request.getContent(), request.getCategory());
        return QuestionResponse.from(question);
    }

    // 질문 삭제 (작성자 본인 또는 관리자 가능)
    @Transactional
    public void deleteQuestion(Long questionId, Long userId) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new CustomException(ErrorCode.QUESTION_NOT_FOUND));

        validateAuthorOrAdmin(question.getUser().getId(), userId);
        questionRepository.delete(question);
    }

    // 작성자 본인 검증
    private void validateAuthor(Long authorId, Long currentUserId) {
        if (!authorId.equals(currentUserId)) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }
    }

    // 작성자 본인 또는 관리자 검증
    private void validateAuthorOrAdmin(Long authorId, Long currentUserId) {
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        boolean isAuthor = authorId.equals(currentUserId);
        boolean isAdmin = currentUser.getRole() == Role.ADMIN;

        if (!isAuthor && !isAdmin) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }
    }
}