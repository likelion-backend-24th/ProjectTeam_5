package com.example.findAnswer.mentorbridge.service;

import com.example.findAnswer.mentorbridge.dto.question.*;
import com.example.findAnswer.mentorbridge.entity.Question;
import com.example.findAnswer.mentorbridge.entity.QuestionLike;
import com.example.findAnswer.mentorbridge.entity.QuestionAttachmentFile;
import com.example.findAnswer.mentorbridge.entity.User;
import com.example.findAnswer.mentorbridge.constants.Role;
import com.example.findAnswer.mentorbridge.exception.CustomException;
import com.example.findAnswer.mentorbridge.constants.ErrorCode;
import com.example.findAnswer.mentorbridge.repository.QuestionLikeRepository;
import com.example.findAnswer.mentorbridge.repository.QuestionAttachmentFileRepository;
import com.example.findAnswer.mentorbridge.repository.QuestionRepository;
import com.example.findAnswer.mentorbridge.repository.UserRepository;
import com.example.findAnswer.mentorbridge.storage.AttachmentStorage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final UserRepository userRepository;
    private final QuestionLikeRepository questionLikeRepository;
    private final QuestionAttachmentFileRepository questionAttachmentFileRepository;
    private final AttachmentStorage attachmentStorage;

    // Cloudinary 전송 시 자동 포맷/품질 최적화
    private static final String IMAGE_TRANSFORM = "f_auto,q_auto";

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

        List<ImageResponse> images = new ArrayList<>();
        for (Long attachmentId : request.getAttachmentIds()) {
            QuestionAttachmentFile file = questionAttachmentFileRepository.findById(attachmentId)
                    .orElseThrow(() -> new CustomException(ErrorCode.RESOURCE_NOT_FOUND));

            if (!file.isOwnedBy(userId)) {
                throw new CustomException(ErrorCode.ACCESS_DENIED);
            }

            file.attachedToQuestion(savedQuestion);

            String url = attachmentStorage.publicUrl(file.getStorageKey(), IMAGE_TRANSFORM);
            images.add(new ImageResponse(file.getId(), url));
        }
        return QuestionResponse.from(savedQuestion, images, false);
    }

    // 질문 상세 조회 (답변 목록 포함)
    public QuestionResponse getQuestion(Long questionId, Long currentUserId) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new CustomException(ErrorCode.QUESTION_NOT_FOUND));

        boolean isLiked = false;
        if (currentUserId != null) {
            isLiked = questionLikeRepository.existsByQuestion_IdAndUser_Id(questionId, currentUserId);
        }
        return QuestionResponse.from(question, imagesOf(questionAttachmentFileRepository.findByQuestion(question)), isLiked);
    }

//    // 질문에 연결된(ATTACHED) 첨부의 CDN URL 목록 생성
//    private List<ImageResponse> imageUrlsOf(Question question) {
//        return question.getQuestionAttachmentFiles().stream()
//                .filter(QuestionAttachmentFile::isAttached)
//                .map(file -> new ImageResponse(file.getId(), attachmentStorage.publicUrl(file.getStorageKey(), IMAGE_TRANSFORM)))
//                .toList();
//    }

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

    @Transactional
    public QuestionLikeResponse toggleLike(Long questionId, Long userId) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new CustomException(ErrorCode.QUESTION_NOT_FOUND));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        Optional<QuestionLike> optionalLike = questionLikeRepository.findByQuestion_IdAndUser_Id(questionId, userId);

        boolean isLiked;
        if (optionalLike.isPresent()) {
            // 이미 좋아요를 누른 상태 -> 좋아요 취소
            questionLikeRepository.delete(optionalLike.get());
            question.decreaseLikeCount();
            isLiked = false;
        } else {
            // 안 누른 상태 -> 좋아요 등록
            questionLikeRepository.save(new QuestionLike(question, user));
            question.increaseLikeCount();
            isLiked = true;
        }

        // 변경된 최신 likeCount를 그대로 반환
        return new QuestionLikeResponse(isLiked, question.getLikeCount());
    }

    // 질문 수정 (작성자 본인만 가능)
    @Transactional
    public QuestionResponse updateQuestion(Long questionId, Long userId, QuestionUpdateRequest request) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new CustomException(ErrorCode.QUESTION_NOT_FOUND));

        Optional<QuestionLike> optionalLike = questionLikeRepository.findByQuestion_IdAndUser_Id(questionId, userId);

        validateAuthor(question.getUser().getId(), userId);
        question.update(request.getTitle(), request.getContent(), request.getCategory());

        List<QuestionAttachmentFile> current = questionAttachmentFileRepository.findByQuestion(question);

        Set<Long> editFile = new HashSet<>(request.getAttachmentIds());

        Set<Long> currentFile = current
                .stream()
                .map(QuestionAttachmentFile::getId)
                .collect(Collectors.toSet());

        List<QuestionAttachmentFile> lastFiles = new ArrayList<>();

        // 빠진 이미지 제거
        for (QuestionAttachmentFile file: current) {
            if(editFile.contains(file.getId())) {
                lastFiles.add(file);
            } else {
                try{
                    attachmentStorage.delete(file.getStorageKey());
                } catch (RuntimeException e) {
                    log.warn("cloudinary 파일 삭제 실패 {}", file.getStorageKey());
                }
                questionAttachmentFileRepository.delete(file);
            }
        }

        // 이미지 새로 추가
        for (Long attachmentId : editFile) {
            if(currentFile.contains(attachmentId)) {
                continue;
            }

            QuestionAttachmentFile file = questionAttachmentFileRepository.findById(attachmentId)
                    .orElseThrow(() -> new CustomException(ErrorCode.RESOURCE_NOT_FOUND));

            if(!file.isOwnedBy(userId)) {
                throw new CustomException(ErrorCode.ACCESS_DENIED);
            }
            if(file.isAttached()) {
                throw new CustomException(ErrorCode.INVALID_REQUEST);
            }

            file.attachedToQuestion(question);
            lastFiles.add(file);
        }

        return QuestionResponse.from(question, imagesOf(lastFiles), optionalLike.isPresent());
    }

    private List<ImageResponse> imagesOf(List<QuestionAttachmentFile> files) {
        return files.stream()
                .filter(QuestionAttachmentFile::isAttached)
                .map(f -> new ImageResponse(f.getId(),
                        attachmentStorage.publicUrl(f.getStorageKey(), IMAGE_TRANSFORM)))
                .toList();
    }

    // 질문 삭제 (작성자 본인 또는 관리자 가능)
    @Transactional
    public void deleteQuestion(Long questionId, Long userId) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new CustomException(ErrorCode.QUESTION_NOT_FOUND));

        validateAuthorOrAdmin(question.getUser().getId(), userId);

        // 첨부 먼저 정리: (1) Cloudinary 원본 삭제 (2) DB 행 삭제 → (3) 질문 삭제.
        // 순서 중요 — question_attachment_files.question_id 가 questions(id)를 FK로 참조하므로
        // 질문을 먼저 지우면 FK 위반이 난다.
        List<QuestionAttachmentFile> attachments =
                questionAttachmentFileRepository.findByQuestion(question);
        for (QuestionAttachmentFile file : attachments) {
            try {
                attachmentStorage.delete(file.getStorageKey());   // 외부 저장소는 실패해도 삭제는 진행
            } catch (RuntimeException e) {
                log.warn("Cloudinary 원본 삭제 실패(무시하고 진행): storageKey={}", file.getStorageKey(), e);
            }
        }
        questionAttachmentFileRepository.deleteAll(attachments);

        questionRepository.delete(question);   // answers 는 cascade+orphanRemoval 로 함께 삭제됨
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
