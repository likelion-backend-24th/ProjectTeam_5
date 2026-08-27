package com.example.findAnswer.mentorbridge.controller;

import com.example.findAnswer.mentorbridge.constants.ErrorCode;
import com.example.findAnswer.mentorbridge.dto.question.QuestionCreateRequest;
import com.example.findAnswer.mentorbridge.dto.question.QuestionLikeResponse;
import com.example.findAnswer.mentorbridge.dto.question.QuestionResponse;
import com.example.findAnswer.mentorbridge.exception.CustomException;
import com.example.findAnswer.mentorbridge.service.QuestionService;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(QuestionController.class)
@DisplayName("QuestionController 슬라이스 테스트")
class QuestionControllerTest {

    @Autowired MockMvc mockMvc;
    // Spring Boot 4의 @WebMvcTest 슬라이스에는 Jackson 자동설정 ObjectMapper 빈이 딸려오지 않아 직접 생성한다.
    private final ObjectMapper objectMapper = new ObjectMapper();
    @MockitoBean QuestionService questionService;

    // 이 프로젝트는 @AuthenticationPrincipal이 Long(userId)이라, 인증을 흉내낼 때도 principal에 Long을 넣어야 한다.
    private UsernamePasswordAuthenticationToken loginAs(Long userId) {
        return new UsernamePasswordAuthenticationToken(
                userId, null, List.of(new SimpleGrantedAuthority("ROLE_USER")));
    }

    private QuestionResponse mockResponse(String title) {
        return QuestionResponse.from(
                com.example.findAnswer.mentorbridge.entity.Question.builder()
                        .user(mockUser())
                        .title(title).content("내용").category("개발")
                        .build());
    }

    private com.example.findAnswer.mentorbridge.entity.User mockUser() {
        com.example.findAnswer.mentorbridge.entity.User user =
                new com.example.findAnswer.mentorbridge.entity.User("author@test.com", "encoded", "작성자",
                        com.example.findAnswer.mentorbridge.constants.Role.USER);
        org.springframework.test.util.ReflectionTestUtils.setField(user, "id", 1L);
        return user;
    }

    @Test
    @DisplayName("로그인한 사용자가 질문을 작성하면 201을 반환한다")
    void createQuestion_성공() throws Exception {
        when(questionService.createQuestion(eq(1L), any())).thenReturn(mockResponse("제목"));

        var body = new QuestionCreateRequest();
        org.springframework.test.util.ReflectionTestUtils.setField(body, "title", "제목");
        org.springframework.test.util.ReflectionTestUtils.setField(body, "content", "내용");
        org.springframework.test.util.ReflectionTestUtils.setField(body, "category", "개발");

        mockMvc.perform(post("/api/questions")
                        .with(authentication(loginAs(1L)))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("제목"));
    }

    @Test
    @DisplayName("제목이 비어있으면 400을 반환한다 (@Valid 검증)")
    void createQuestion_검증실패_빈제목() throws Exception {
        var body = new QuestionCreateRequest();
        org.springframework.test.util.ReflectionTestUtils.setField(body, "title", "");
        org.springframework.test.util.ReflectionTestUtils.setField(body, "content", "내용");
        org.springframework.test.util.ReflectionTestUtils.setField(body, "category", "개발");

        mockMvc.perform(post("/api/questions")
                        .with(authentication(loginAs(1L)))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest());
    }

    // 비로그인 접근 시 401을 반환하는 로직은 SecurityConfig의 커스텀 AuthenticationEntryPoint에 있는데,
    // @WebMvcTest 슬라이스는 SecurityConfig를 로드하지 않아 스프링 시큐리티 기본 동작(302 로그인 리다이렉트)이
    // 나온다. 이 경계값은 실제 SecurityConfig가 뜨는 AuthFlowIntegrationTest에서 검증한다.

    @Test
    @DisplayName("질문 상세 조회 성공 시 200과 본문을 반환한다")
    void getQuestion_성공() throws Exception {
        when(questionService.getQuestion(eq(10L), any())).thenReturn(mockResponse("상세 제목"));

        mockMvc.perform(get("/api/questions/10").with(authentication(loginAs(1L))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("상세 제목"));
    }

    @Test
    @DisplayName("존재하지 않는 질문을 조회하면 404를 반환한다")
    void getQuestion_없음_404() throws Exception {
        when(questionService.getQuestion(eq(404L), any()))
                .thenThrow(new CustomException(ErrorCode.QUESTION_NOT_FOUND));

        mockMvc.perform(get("/api/questions/404").with(authentication(loginAs(1L))))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("QUESTION_NOT_FOUND"));
    }

    @Test
    @DisplayName("작성자가 아니면 질문 수정 시 403을 반환한다")
    void updateQuestion_타인_403() throws Exception {
        when(questionService.updateQuestion(eq(10L), eq(2L), any()))
                .thenThrow(new CustomException(ErrorCode.ACCESS_DENIED));

        var body = new com.example.findAnswer.mentorbridge.dto.question.QuestionUpdateRequest();
        org.springframework.test.util.ReflectionTestUtils.setField(body, "title", "수정 제목");
        org.springframework.test.util.ReflectionTestUtils.setField(body, "content", "수정 내용");
        org.springframework.test.util.ReflectionTestUtils.setField(body, "category", "개발");

        mockMvc.perform(patch("/api/questions/10")
                        .with(authentication(loginAs(2L)))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ACCESS_DENIED"));
    }

    @Test
    @DisplayName("작성자 본인이 질문을 삭제하면 204를 반환한다")
    void deleteQuestion_성공() throws Exception {
        mockMvc.perform(delete("/api/questions/10")
                        .with(authentication(loginAs(1L)))
                        .with(csrf()))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("좋아요 토글 성공 시 200과 결과를 반환한다")
    void toggleLike_성공() throws Exception {
        when(questionService.toggleLike(10L, 1L)).thenReturn(new QuestionLikeResponse(true, 1));

        mockMvc.perform(post("/api/questions/10/like")
                        .with(authentication(loginAs(1L)))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isLiked").value(true))
                .andExpect(jsonPath("$.likeCount").value(1));
    }
}
