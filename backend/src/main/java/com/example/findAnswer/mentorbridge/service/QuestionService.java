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
import com.example.findAnswer.mentorbridge.storage.FileStorage;
import com.example.findAnswer.mentorbridge.constants.AttachmentFileType;
import com.example.findAnswer.mentorbridge.dto.questionAttachedFile.FileResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
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
    private final FileStorage fileStorage;

    private static final String IMAGE_TRANSFORM = "f_auto,q_auto";

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

        List<QuestionAttachmentFile> attached = new ArrayList<>();
        for (Long attachmentId : request.getAttachmentIds()) {
            QuestionAttachmentFile file = questionAttachmentFileRepository.findById(attachmentId)
                    .orElseThrow(() -> new CustomException(ErrorCode.RESOURCE_NOT_FOUND));

            if (!file.isOwnedBy(userId)) {
                throw new CustomException(ErrorCode.ACCESS_DENIED);
            }

            file.attachedToQuestion(savedQuestion);
            attached.add(file);
        }
        return QuestionResponse.from(savedQuestion, imagesOf(attached), filesOf(attached), false);
    }

    public QuestionResponse getQuestion(Long questionId, Long currentUserId) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new CustomException(ErrorCode.QUESTION_NOT_FOUND));

        boolean isLiked = false;
        if (currentUserId != null) {
            isLiked = questionLikeRepository.existsByQuestion_IdAndUser_Id(questionId, currentUserId);
        }
        List<QuestionAttachmentFile> attachments = questionAttachmentFileRepository.findByQuestion(question);
        return QuestionResponse.from(question, imagesOf(attachments), filesOf(attachments), isLiked);
    }

    //통합 질문 목록 조회 (검색어, 카테고리, 정렬 반영)
    public Page<QuestionListResponse> getQuestions(String category, String keyword, Pageable pageable) {
        boolean hasCategory = category != null && !category.equals("전체");
        boolean hasKeyword = keyword != null && !keyword.trim().isEmpty();

        // 1. 답변 많은순 정렬 요청 감지
        boolean isAnswerCountSort = pageable.getSort().stream()
                .anyMatch(order -> order.getProperty().equals("answerCount"));

        if (isAnswerCountSort) {
            Pageable unsortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize());

            if (hasCategory && hasKeyword) {
                return questionRepository.findByCategoryAndKeywordOrderByAnswersDesc(category, keyword, unsortedPageable)
                        .map(QuestionListResponse::from);
            }
            if (hasKeyword) {
                return questionRepository.findByKeywordOrderByAnswersDesc(keyword, unsortedPageable)
                        .map(QuestionListResponse::from);
            }
            if (hasCategory) {
                return questionRepository.findByCategoryOrderByAnswersDesc(category, unsortedPageable)
                        .map(QuestionListResponse::from);
            }
            return questionRepository.findAllOrderByAnswersDesc(unsortedPageable)
                    .map(QuestionListResponse::from);
        }

        // 2. 일반 정렬 (최신순, 오래된순, 좋아요순 등)
        if (hasCategory && hasKeyword) {
            return questionRepository.findByCategoryAndKeyword(category, keyword, pageable)
                    .map(QuestionListResponse::from);
        }
        if (hasKeyword) {
            return questionRepository.findByTitleContainingOrContentContaining(keyword, keyword, pageable)
                    .map(QuestionListResponse::from);
        }
        if (hasCategory) {
            return questionRepository.findByCategory(category, pageable)
                    .map(QuestionListResponse::from);
        }

        return questionRepository.findAll(pageable)
                .map(QuestionListResponse::from);
    }

    public Page<QuestionListResponse> getQuestions(Pageable pageable) {
        return getQuestions("전체", null, pageable);
    }

    public Page<QuestionListResponse> getQuestionsByUserId(Long userId, Pageable pageable) {
        userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        return questionRepository.findByUserId(userId, pageable)
                .map(QuestionListResponse::from);
    }

    //팔로잉 유저들의 질문 목록 조회
    @Transactional(readOnly = true)
    public Page<QuestionListResponse> getFollowingQuestions(Long followerId, Pageable pageable) {
        return questionRepository.findByFollowingUsers(followerId, pageable)
                .map(QuestionListResponse::from);
    }

    // 유저가 답변한 질문 목록 조회
    @Transactional(readOnly = true)
    public Page<QuestionListResponse> getAnsweredQuestionsByUser(Long userId, Pageable pageable) {
        return questionRepository.findQuestionsByAnsweredUserId(userId, pageable)
                .map(QuestionListResponse::from);
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
            questionLikeRepository.delete(optionalLike.get());
            question.decreaseLikeCount();
            isLiked = false;
        } else {
            questionLikeRepository.save(new QuestionLike(question, user));
            question.increaseLikeCount();
            isLiked = true;
        }

        return new QuestionLikeResponse(isLiked, question.getLikeCount());
    }

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

        for (QuestionAttachmentFile file: current) {
            if(editFile.contains(file.getId())) {
                lastFiles.add(file);
            } else {
                deleteAttachmentBlob(file);
                questionAttachmentFileRepository.delete(file);
            }
        }

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

        return QuestionResponse.from(question, imagesOf(lastFiles), filesOf(lastFiles), optionalLike.isPresent());
    }

    private List<ImageResponse> imagesOf(List<QuestionAttachmentFile> files) {
        return files.stream()
                .filter(QuestionAttachmentFile::isAttached)
                .filter(f -> f.getAttachmentType() == AttachmentFileType.IMAGE)
                .map(f -> new ImageResponse(f.getId(),
                        attachmentStorage.publicUrl(f.getStorageKey(), IMAGE_TRANSFORM)))
                .toList();
    }

    private List<FileResponse> filesOf(List<QuestionAttachmentFile> files) {
        return files.stream()
                .filter(QuestionAttachmentFile::isAttached)
                .filter(f -> f.getAttachmentType() == AttachmentFileType.FILE)
                .map(f -> new FileResponse(f.getId(), f.getOriginalFileName(), f.getSize(),
                        "/api/attachments/files/" + f.getId() + "/download"))
                .toList();
    }

    // 이미지는 Cloudinary, 일반 파일은 로컬 디스크에 저장돼서 삭제 방식이 다르다.
    private void deleteAttachmentBlob(QuestionAttachmentFile file) {
        try {
            if (file.getAttachmentType() == AttachmentFileType.IMAGE) {
                attachmentStorage.delete(file.getStorageKey());
            } else {
                fileStorage.delete(file.getStorageKey());
            }
        } catch (RuntimeException e) {
            log.warn("첨부파일 삭제 실패(무시하고 진행): storageKey={}", file.getStorageKey(), e);
        }
    }

    @Transactional
    public void deleteQuestion(Long questionId, Long userId) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new CustomException(ErrorCode.QUESTION_NOT_FOUND));

        validateAuthorOrAdmin(question.getUser().getId(), userId);

        List<QuestionAttachmentFile> attachments =
                questionAttachmentFileRepository.findByQuestion(question);
        for (QuestionAttachmentFile file : attachments) {
            deleteAttachmentBlob(file);
        }
        questionAttachmentFileRepository.deleteAll(attachments);

        questionRepository.delete(question);
    }

    private void validateAuthor(Long authorId, Long currentUserId) {
        if (!authorId.equals(currentUserId)) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }
    }

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