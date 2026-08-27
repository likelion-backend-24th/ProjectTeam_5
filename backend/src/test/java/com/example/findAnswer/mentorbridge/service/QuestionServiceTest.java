package com.example.findAnswer.mentorbridge.service;

import com.example.findAnswer.mentorbridge.constants.ErrorCode;
import com.example.findAnswer.mentorbridge.constants.Role;
import com.example.findAnswer.mentorbridge.dto.question.QuestionCreateRequest;
import com.example.findAnswer.mentorbridge.dto.question.QuestionLikeResponse;
import com.example.findAnswer.mentorbridge.dto.question.QuestionResponse;
import com.example.findAnswer.mentorbridge.dto.question.QuestionUpdateRequest;
import com.example.findAnswer.mentorbridge.entity.Question;
import com.example.findAnswer.mentorbridge.entity.QuestionLike;
import com.example.findAnswer.mentorbridge.entity.User;
import com.example.findAnswer.mentorbridge.exception.CustomException;
import com.example.findAnswer.mentorbridge.repository.AnswerRepository;
import com.example.findAnswer.mentorbridge.repository.QuestionAttachmentFileRepository;
import com.example.findAnswer.mentorbridge.repository.QuestionLikeRepository;
import com.example.findAnswer.mentorbridge.repository.QuestionRepository;
import com.example.findAnswer.mentorbridge.repository.UserRepository;
import com.example.findAnswer.mentorbridge.storage.AttachmentStorage;
import com.example.findAnswer.mentorbridge.storage.FileStorage;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@DisplayName("QuestionService 단위 테스트")
class QuestionServiceTest {

    @Mock QuestionRepository questionRepository;
    @Mock UserRepository userRepository;
    @Mock QuestionLikeRepository questionLikeRepository;
    @Mock QuestionAttachmentFileRepository questionAttachmentFileRepository;
    @Mock AnswerRepository answerRepository;
    @Mock AttachmentStorage attachmentStorage;
    @Mock FileStorage fileStorage;

    @InjectMocks
    QuestionService questionService;

    private static final Long AUTHOR_ID = 1L;
    private static final Long OTHER_USER_ID = 999L;
    private static final Long QUESTION_ID = 10L;

    private User newUser(Long id, String name) {
        User user = new User("user" + id + "@test.com", "encoded", name, Role.USER);
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }

    private Question newQuestion(User author) {
        Question question = Question.builder()
                .user(author).title("원래 제목").content("원래 내용").category("개발")
                .build();
        ReflectionTestUtils.setField(question, "id", QUESTION_ID);
        return question;
    }

    private QuestionCreateRequest createRequest(String title, String content, String category) {
        QuestionCreateRequest request = new QuestionCreateRequest();
        ReflectionTestUtils.setField(request, "title", title);
        ReflectionTestUtils.setField(request, "content", content);
        ReflectionTestUtils.setField(request, "category", category);
        return request;
    }

    private QuestionUpdateRequest updateRequest(String title, String content, String category) {
        QuestionUpdateRequest request = new QuestionUpdateRequest();
        ReflectionTestUtils.setField(request, "title", title);
        ReflectionTestUtils.setField(request, "content", content);
        ReflectionTestUtils.setField(request, "category", category);
        return request;
    }

    @Test
    @DisplayName("정상 입력이면 질문을 생성한다")
    void createQuestion_성공() {
        User author = newUser(AUTHOR_ID, "작성자");
        given(userRepository.findById(AUTHOR_ID)).willReturn(Optional.of(author));
        given(questionRepository.save(org.mockito.ArgumentMatchers.any(Question.class)))
                .willAnswer(invocation -> {
                    Question q = invocation.getArgument(0);
                    ReflectionTestUtils.setField(q, "id", QUESTION_ID);
                    return q;
                });

        QuestionResponse response = questionService.createQuestion(AUTHOR_ID, createRequest("제목", "내용", "개발"));

        assertThat(response.getTitle()).isEqualTo("제목");
        assertThat(response.getUserId()).isEqualTo(AUTHOR_ID);
    }

    @Test
    @DisplayName("존재하지 않는 사용자가 질문을 작성하면 USER_NOT_FOUND 예외가 발생한다")
    void createQuestion_유저없음_실패() {
        given(userRepository.findById(AUTHOR_ID)).willReturn(Optional.empty());

        assertThatThrownBy(() -> questionService.createQuestion(AUTHOR_ID, createRequest("제목", "내용", "개발")))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.USER_NOT_FOUND);
    }

    @Test
    @DisplayName("존재하지 않는 질문을 조회하면 QUESTION_NOT_FOUND 예외가 발생한다")
    void getQuestion_없음_실패() {
        given(questionRepository.findById(404L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> questionService.getQuestion(404L, AUTHOR_ID))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.QUESTION_NOT_FOUND);
    }

    @Test
    @DisplayName("좋아요를 누른 상태로 조회하면 isLiked가 true로 반환된다")
    void getQuestion_좋아요반영() {
        User author = newUser(AUTHOR_ID, "작성자");
        Question question = newQuestion(author);
        given(questionRepository.findById(QUESTION_ID)).willReturn(Optional.of(question));
        given(questionLikeRepository.existsByQuestion_IdAndUser_Id(QUESTION_ID, AUTHOR_ID)).willReturn(true);
        given(questionAttachmentFileRepository.findByQuestion(question)).willReturn(java.util.List.of());

        QuestionResponse response = questionService.getQuestion(QUESTION_ID, AUTHOR_ID);

        assertThat(response.isLiked()).isTrue();
    }

    @Test
    @DisplayName("작성자 본인이면 질문을 수정할 수 있다")
    void updateQuestion_작성자본인_성공() {
        User author = newUser(AUTHOR_ID, "작성자");
        Question question = newQuestion(author);
        given(questionRepository.findById(QUESTION_ID)).willReturn(Optional.of(question));
        given(questionLikeRepository.findByQuestion_IdAndUser_Id(QUESTION_ID, AUTHOR_ID)).willReturn(Optional.empty());
        given(questionAttachmentFileRepository.findByQuestion(question)).willReturn(java.util.List.of());

        QuestionResponse result = questionService.updateQuestion(QUESTION_ID, AUTHOR_ID, updateRequest("새 제목", "새 내용", "취업"));

        assertThat(result.getTitle()).isEqualTo("새 제목");
        // no-op 버그 방지: 응답 DTO뿐 아니라 엔티티 자체가 실제로 바뀌었는지 확인
        assertThat(question.getContent()).isEqualTo("새 내용");
        assertThat(question.getCategory()).isEqualTo("취업");
    }

    @Test
    @DisplayName("작성자가 아니면 ACCESS_DENIED 예외가 발생하고 내용은 변경되지 않는다")
    void updateQuestion_타인_실패() {
        User author = newUser(AUTHOR_ID, "작성자");
        Question question = newQuestion(author);
        given(questionRepository.findById(QUESTION_ID)).willReturn(Optional.of(question));
        given(questionLikeRepository.findByQuestion_IdAndUser_Id(QUESTION_ID, OTHER_USER_ID)).willReturn(Optional.empty());

        assertThatThrownBy(() -> questionService.updateQuestion(QUESTION_ID, OTHER_USER_ID, updateRequest("x", "y", "취업")))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ACCESS_DENIED);

        assertThat(question.getTitle()).isEqualTo("원래 제목");
    }

    @Test
    @DisplayName("작성자 본인이면 질문을 삭제할 수 있다")
    void deleteQuestion_작성자본인_성공() {
        User author = newUser(AUTHOR_ID, "작성자");
        Question question = newQuestion(author);
        given(questionRepository.findById(QUESTION_ID)).willReturn(Optional.of(question));
        given(userRepository.findById(AUTHOR_ID)).willReturn(Optional.of(author));
        given(questionAttachmentFileRepository.findByQuestion(question)).willReturn(java.util.List.of());
        given(questionLikeRepository.findByQuestion_Id(QUESTION_ID)).willReturn(java.util.List.of());
        given(answerRepository.findByQuestion_IdOrderByCreatedAtAsc(QUESTION_ID)).willReturn(java.util.List.of());

        questionService.deleteQuestion(QUESTION_ID, AUTHOR_ID);

        verify(questionRepository, times(1)).delete(question);
    }

    @Test
    @DisplayName("작성자도 관리자도 아니면 질문을 삭제할 수 없다")
    void deleteQuestion_권한없음_실패() {
        User author = newUser(AUTHOR_ID, "작성자");
        User other = newUser(OTHER_USER_ID, "다른 유저");
        Question question = newQuestion(author);
        given(questionRepository.findById(QUESTION_ID)).willReturn(Optional.of(question));
        given(userRepository.findById(OTHER_USER_ID)).willReturn(Optional.of(other));

        assertThatThrownBy(() -> questionService.deleteQuestion(QUESTION_ID, OTHER_USER_ID))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ACCESS_DENIED);

        verify(questionRepository, never()).delete(org.mockito.ArgumentMatchers.any());
    }

    @Test
    @DisplayName("좋아요가 없는 상태에서 토글하면 좋아요가 추가된다")
    void toggleLike_좋아요_추가() {
        User author = newUser(AUTHOR_ID, "작성자");
        Question question = newQuestion(author);
        given(questionRepository.findById(QUESTION_ID)).willReturn(Optional.of(question));
        given(userRepository.findById(AUTHOR_ID)).willReturn(Optional.of(author));
        given(questionLikeRepository.findByQuestion_IdAndUser_Id(QUESTION_ID, AUTHOR_ID)).willReturn(Optional.empty());

        QuestionLikeResponse response = questionService.toggleLike(QUESTION_ID, AUTHOR_ID);

        assertThat(response.isLiked()).isTrue();
        assertThat(question.getLikeCount()).isEqualTo(1);
        verify(questionLikeRepository, times(1)).save(org.mockito.ArgumentMatchers.any(QuestionLike.class));
    }

    @Test
    @DisplayName("이미 좋아요한 상태에서 토글하면 좋아요가 취소된다")
    void toggleLike_좋아요_취소() {
        User author = newUser(AUTHOR_ID, "작성자");
        Question question = newQuestion(author);
        question.increaseLikeCount();
        QuestionLike existingLike = new QuestionLike(question, author);
        given(questionRepository.findById(QUESTION_ID)).willReturn(Optional.of(question));
        given(userRepository.findById(AUTHOR_ID)).willReturn(Optional.of(author));
        given(questionLikeRepository.findByQuestion_IdAndUser_Id(QUESTION_ID, AUTHOR_ID)).willReturn(Optional.of(existingLike));

        QuestionLikeResponse response = questionService.toggleLike(QUESTION_ID, AUTHOR_ID);

        assertThat(response.isLiked()).isFalse();
        assertThat(question.getLikeCount()).isEqualTo(0);
        verify(questionLikeRepository, times(1)).delete(existingLike);
    }
}
