package com.example.findAnswer.dev.service;

import com.example.findAnswer.dev.dto.Answer.AnswerCreateRequest;
import com.example.findAnswer.dev.dto.Answer.AnswerResponse;
import com.example.findAnswer.dev.dto.Answer.AnswerUpdateRequest;
import com.example.findAnswer.dev.entity.Answer;
import com.example.findAnswer.dev.entity.Question;
import com.example.findAnswer.dev.domain.Role;
import com.example.findAnswer.dev.entity.User;
import com.example.findAnswer.dev.exception.CustomException;
import com.example.findAnswer.dev.exception.ErrorCode;
import com.example.findAnswer.dev.repository.AnswerRepository;
import com.example.findAnswer.dev.repository.QuestionRepository;
import com.example.findAnswer.dev.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnswerService {

    private final AnswerRepository answerRepository;
    private final QuestionRepository questionRepository;
    private final UserRepository userRepository;

    // 답변/대댓글 등록
    @Transactional
    public AnswerResponse createAnswer(Long questionId, Long userId, AnswerCreateRequest request) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new CustomException(ErrorCode.QUESTION_NOT_FOUND));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        Answer parent = null;
        if (request.getParentId() != null) {
            parent = answerRepository.findById(request.getParentId())
                    .orElseThrow(() -> new CustomException(ErrorCode.ANSWER_NOT_FOUND));

            // 검증 1: 부모 답변이 해당 질문에 속해 있는지 확인
            if (!parent.getQuestion().getId().equals(questionId)) {
                throw new CustomException(ErrorCode.INVALID_REQUEST);
            }
        }

        Answer answer = Answer.builder()
                .question(question)
                .user(user)
                .content(request.getContent())
                .parent(parent)
                .build();

        Answer savedAnswer = answerRepository.save(answer);
        return AnswerResponse.from(savedAnswer);
    }

    // 특정 질문의 답변 및 대댓글 목록 조회 (등록순)
    public List<AnswerResponse> getAnswersByQuestionId(Long questionId) {
        return answerRepository.findByQuestionIdOrderByCreatedAtAsc(questionId).stream()
                .map(AnswerResponse::from)
                .collect(Collectors.toList());
    }

    // 답변 수정 (작성자 본인만 가능)
    @Transactional
    public AnswerResponse updateAnswer(Long answerId, Long userId, AnswerUpdateRequest request) {
        Answer answer = answerRepository.findById(answerId)
                .orElseThrow(() -> new CustomException(ErrorCode.ANSWER_NOT_FOUND));

        validateAuthor(answer.getUser().getId(), userId);
        answer.update(request.getContent());
        return AnswerResponse.from(answer);
    }

    // 답변 삭제 (작성자 본인 또는 관리자 가능)
    @Transactional
    public void deleteAnswer(Long answerId, Long userId) {
        Answer answer = answerRepository.findById(answerId)
                .orElseThrow(() -> new CustomException(ErrorCode.ANSWER_NOT_FOUND));

        validateAuthorOrAdmin(answer.getUser().getId(), userId);
        answerRepository.delete(answer);
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