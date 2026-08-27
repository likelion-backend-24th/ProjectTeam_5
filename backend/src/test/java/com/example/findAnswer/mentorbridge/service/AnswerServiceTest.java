package com.example.findAnswer.mentorbridge.service;

import com.example.findAnswer.mentorbridge.constants.ErrorCode;
import com.example.findAnswer.mentorbridge.constants.Role;
import com.example.findAnswer.mentorbridge.dto.answer.AnswerCreateRequest;
import com.example.findAnswer.mentorbridge.dto.answer.AnswerResponse;
import com.example.findAnswer.mentorbridge.dto.answer.AnswerUpdateRequest;
import com.example.findAnswer.mentorbridge.entity.Answer;
import com.example.findAnswer.mentorbridge.entity.Question;
import com.example.findAnswer.mentorbridge.entity.User;
import com.example.findAnswer.mentorbridge.exception.CustomException;
import com.example.findAnswer.mentorbridge.repository.AnswerRepository;
import com.example.findAnswer.mentorbridge.repository.QuestionRepository;
import com.example.findAnswer.mentorbridge.repository.UserRepository;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@DisplayName("AnswerService 단위 테스트")
class AnswerServiceTest {

    @Mock AnswerRepository answerRepository;
    @Mock QuestionRepository questionRepository;
    @Mock UserRepository userRepository;
    @Mock NotificationService notificationService;

    @InjectMocks
    AnswerService answerService;

    private static final Long QUESTION_AUTHOR_ID = 1L;
    private static final Long ANSWERER_ID = 2L;
    private static final Long OTHER_USER_ID = 999L;
    private static final Long QUESTION_ID = 10L;
    private static final Long ANSWER_ID = 100L;

    private User newUser(Long id, String name) {
        User user = new User("user" + id + "@test.com", "encoded", name, Role.USER);
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }

    private Question newQuestion(User author) {
        Question question = Question.builder()
                .user(author).title("제목").content("내용").category("개발")
                .build();
        ReflectionTestUtils.setField(question, "id", QUESTION_ID);
        return question;
    }

    private AnswerCreateRequest createRequest(String content, Long parentId) {
        AnswerCreateRequest request = new AnswerCreateRequest();
        ReflectionTestUtils.setField(request, "content", content);
        ReflectionTestUtils.setField(request, "parentId", parentId);
        return request;
    }

    private AnswerUpdateRequest updateRequest(String content) {
        AnswerUpdateRequest request = new AnswerUpdateRequest();
        ReflectionTestUtils.setField(request, "content", content);
        return request;
    }

    @Test
    @DisplayName("질문 작성자가 아닌 사용자가 최상위 답변을 작성하면 질문 작성자에게 알림이 간다")
    void createAnswer_최상위답변_알림발송() {
        User questionAuthor = newUser(QUESTION_AUTHOR_ID, "질문자");
        User answerer = newUser(ANSWERER_ID, "답변자");
        Question question = newQuestion(questionAuthor);

        given(questionRepository.findById(QUESTION_ID)).willReturn(Optional.of(question));
        given(userRepository.findById(ANSWERER_ID)).willReturn(Optional.of(answerer));
        given(answerRepository.save(any(Answer.class))).willAnswer(invocation -> {
            Answer a = invocation.getArgument(0);
            ReflectionTestUtils.setField(a, "id", ANSWER_ID);
            return a;
        });

        AnswerResponse response = answerService.createAnswer(QUESTION_ID, ANSWERER_ID, createRequest("답변 내용", null));

        assertThat(response.getContent()).isEqualTo("답변 내용");
        assertThat(response.getParentId()).isNull();
        verify(notificationService, times(1))
                .notify(eq(QUESTION_AUTHOR_ID), any(), anyString(), anyString());
    }

    @Test
    @DisplayName("본인 질문에 본인이 답변하면 알림이 발송되지 않는다")
    void createAnswer_본인질문_알림없음() {
        User questionAuthor = newUser(QUESTION_AUTHOR_ID, "질문자");
        Question question = newQuestion(questionAuthor);

        given(questionRepository.findById(QUESTION_ID)).willReturn(Optional.of(question));
        given(userRepository.findById(QUESTION_AUTHOR_ID)).willReturn(Optional.of(questionAuthor));
        given(answerRepository.save(any(Answer.class))).willAnswer(invocation -> invocation.getArgument(0));

        answerService.createAnswer(QUESTION_ID, QUESTION_AUTHOR_ID, createRequest("답변 내용", null));

        verify(notificationService, never()).notify(anyLong(), any(), anyString(), anyString());
    }

    @Test
    @DisplayName("대댓글은 부모 답변에 연결되고 부모 작성자에게 알림이 간다")
    void createAnswer_대댓글_부모연결_알림발송() {
        User questionAuthor = newUser(QUESTION_AUTHOR_ID, "질문자");
        User parentAnswerer = newUser(ANSWERER_ID, "답변자");
        User replier = newUser(OTHER_USER_ID, "대댓글러");
        Question question = newQuestion(questionAuthor);

        Answer parentAnswer = Answer.builder()
                .question(question).user(parentAnswerer).content("부모 답변").build();
        ReflectionTestUtils.setField(parentAnswer, "id", ANSWER_ID);

        given(questionRepository.findById(QUESTION_ID)).willReturn(Optional.of(question));
        given(userRepository.findById(OTHER_USER_ID)).willReturn(Optional.of(replier));
        given(answerRepository.findById(ANSWER_ID)).willReturn(Optional.of(parentAnswer));
        given(answerRepository.save(any(Answer.class))).willAnswer(invocation -> invocation.getArgument(0));

        AnswerResponse response = answerService.createAnswer(QUESTION_ID, OTHER_USER_ID, createRequest("대댓글 내용", ANSWER_ID));

        assertThat(response.getParentId()).isEqualTo(ANSWER_ID);
        verify(notificationService, times(1))
                .notify(eq(ANSWERER_ID), any(), anyString(), anyString());
    }

    @Test
    @DisplayName("다른 질문에 속한 답변을 부모로 지정하면 INVALID_REQUEST 예외가 발생한다")
    void createAnswer_다른질문의답변을부모로_실패() {
        User questionAuthor = newUser(QUESTION_AUTHOR_ID, "질문자");
        Question question = newQuestion(questionAuthor);

        Question otherQuestion = Question.builder()
                .user(questionAuthor).title("다른 질문").content("내용").category("개발").build();
        ReflectionTestUtils.setField(otherQuestion, "id", 999L);

        Answer parentFromOtherQuestion = Answer.builder()
                .question(otherQuestion).user(questionAuthor).content("다른 질문의 답변").build();
        ReflectionTestUtils.setField(parentFromOtherQuestion, "id", ANSWER_ID);

        given(questionRepository.findById(QUESTION_ID)).willReturn(Optional.of(question));
        given(userRepository.findById(ANSWERER_ID)).willReturn(Optional.of(newUser(ANSWERER_ID, "답변자")));
        given(answerRepository.findById(ANSWER_ID)).willReturn(Optional.of(parentFromOtherQuestion));

        assertThatThrownBy(() -> answerService.createAnswer(QUESTION_ID, ANSWERER_ID, createRequest("내용", ANSWER_ID)))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_REQUEST);
    }

    @Test
    @DisplayName("존재하지 않는 답변을 부모로 지정하면 ANSWER_NOT_FOUND 예외가 발생한다")
    void createAnswer_부모답변없음_실패() {
        User questionAuthor = newUser(QUESTION_AUTHOR_ID, "질문자");
        Question question = newQuestion(questionAuthor);

        given(questionRepository.findById(QUESTION_ID)).willReturn(Optional.of(question));
        given(userRepository.findById(ANSWERER_ID)).willReturn(Optional.of(newUser(ANSWERER_ID, "답변자")));
        given(answerRepository.findById(404L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> answerService.createAnswer(QUESTION_ID, ANSWERER_ID, createRequest("내용", 404L)))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ANSWER_NOT_FOUND);
    }

    @Test
    @DisplayName("작성자 본인이면 답변을 수정할 수 있다")
    void updateAnswer_작성자본인_성공() {
        User answerer = newUser(ANSWERER_ID, "답변자");
        Answer answer = Answer.builder().question(newQuestion(newUser(QUESTION_AUTHOR_ID, "질문자")))
                .user(answerer).content("원래 내용").build();
        ReflectionTestUtils.setField(answer, "id", ANSWER_ID);
        given(answerRepository.findById(ANSWER_ID)).willReturn(Optional.of(answer));

        AnswerResponse response = answerService.updateAnswer(ANSWER_ID, ANSWERER_ID, updateRequest("수정된 내용"));

        assertThat(response.getContent()).isEqualTo("수정된 내용");
        assertThat(answer.getContent()).isEqualTo("수정된 내용");
    }

    @Test
    @DisplayName("작성자가 아니면 답변을 수정할 수 없다")
    void updateAnswer_타인_실패() {
        User answerer = newUser(ANSWERER_ID, "답변자");
        Answer answer = Answer.builder().question(newQuestion(newUser(QUESTION_AUTHOR_ID, "질문자")))
                .user(answerer).content("원래 내용").build();
        ReflectionTestUtils.setField(answer, "id", ANSWER_ID);
        given(answerRepository.findById(ANSWER_ID)).willReturn(Optional.of(answer));

        assertThatThrownBy(() -> answerService.updateAnswer(ANSWER_ID, OTHER_USER_ID, updateRequest("수정 시도")))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ACCESS_DENIED);
        assertThat(answer.getContent()).isEqualTo("원래 내용");
    }

    @Test
    @DisplayName("작성자 본인이면 답변을 삭제할 수 있다")
    void deleteAnswer_작성자본인_성공() {
        User answerer = newUser(ANSWERER_ID, "답변자");
        Answer answer = Answer.builder().question(newQuestion(newUser(QUESTION_AUTHOR_ID, "질문자")))
                .user(answerer).content("내용").build();
        ReflectionTestUtils.setField(answer, "id", ANSWER_ID);
        given(answerRepository.findById(ANSWER_ID)).willReturn(Optional.of(answer));
        // validateAuthorOrAdmin은 본인 삭제 케이스에서도 역할 확인을 위해 항상 currentUser를 조회한다.
        given(userRepository.findById(ANSWERER_ID)).willReturn(Optional.of(answerer));

        answerService.deleteAnswer(ANSWER_ID, ANSWERER_ID);

        verify(answerRepository, times(1)).delete(answer);
    }

    @Test
    @DisplayName("관리자는 타인의 답변도 삭제할 수 있다")
    void deleteAnswer_관리자_성공() {
        User answerer = newUser(ANSWERER_ID, "답변자");
        User admin = new User("admin@test.com", "encoded", "관리자", Role.ADMIN);
        ReflectionTestUtils.setField(admin, "id", OTHER_USER_ID);
        Answer answer = Answer.builder().question(newQuestion(newUser(QUESTION_AUTHOR_ID, "질문자")))
                .user(answerer).content("내용").build();
        ReflectionTestUtils.setField(answer, "id", ANSWER_ID);
        given(answerRepository.findById(ANSWER_ID)).willReturn(Optional.of(answer));
        given(userRepository.findById(OTHER_USER_ID)).willReturn(Optional.of(admin));

        answerService.deleteAnswer(ANSWER_ID, OTHER_USER_ID);

        verify(answerRepository, times(1)).delete(answer);
    }

    @Test
    @DisplayName("일반 사용자가 타인의 답변을 삭제하려 하면 ACCESS_DENIED 예외가 발생한다")
    void deleteAnswer_일반유저_타인답변_실패() {
        User answerer = newUser(ANSWERER_ID, "답변자");
        User other = newUser(OTHER_USER_ID, "다른 유저");
        Answer answer = Answer.builder().question(newQuestion(newUser(QUESTION_AUTHOR_ID, "질문자")))
                .user(answerer).content("내용").build();
        ReflectionTestUtils.setField(answer, "id", ANSWER_ID);
        given(answerRepository.findById(ANSWER_ID)).willReturn(Optional.of(answer));
        given(userRepository.findById(OTHER_USER_ID)).willReturn(Optional.of(other));

        assertThatThrownBy(() -> answerService.deleteAnswer(ANSWER_ID, OTHER_USER_ID))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ACCESS_DENIED);
        verify(answerRepository, never()).delete(any());
    }
}
