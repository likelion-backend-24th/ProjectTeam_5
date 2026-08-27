package com.example.findAnswer.mentorbridge.repository;

import com.example.findAnswer.mentorbridge.constants.Role;
import com.example.findAnswer.mentorbridge.entity.Question;
import com.example.findAnswer.mentorbridge.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
@DisplayName("QuestionRepository 슬라이스 테스트")
class QuestionRepositoryTest {

    @Autowired QuestionRepository questionRepository;
    @Autowired UserRepository userRepository;

    private User author;

    @BeforeEach
    void setUp() {
        author = userRepository.save(new User("author@test.com", "encoded", "작성자", Role.USER));

        questionRepository.save(Question.builder()
                .user(author).title("자바 스트림 질문").content("stream이 뭔가요").category("개발").build());
        questionRepository.save(Question.builder()
                .user(author).title("이력서 첨삭 부탁드려요").content("면접 준비 관련 내용").category("취업").build());
        questionRepository.save(Question.builder()
                .user(author).title("스프링 시큐리티 질문").content("jwt 관련 stream 처리 문의").category("개발").build());
    }

    @Test
    @DisplayName("카테고리로 질문을 필터링해서 조회한다")
    void findByCategory() {
        Page<Question> page = questionRepository.findByCategory("개발", PageRequest.of(0, 10));

        assertThat(page.getTotalElements()).isEqualTo(2);
        assertThat(page.getContent()).allMatch(q -> q.getCategory().equals("개발"));
    }

    @Test
    @DisplayName("제목에 포함된 키워드로 검색된다")
    void findByTitleContainingOrContentContaining_제목매칭() {
        Page<Question> page = questionRepository.findByTitleContainingOrContentContaining("이력서", "이력서", PageRequest.of(0, 10));

        assertThat(page.getTotalElements()).isEqualTo(1);
        assertThat(page.getContent().get(0).getTitle()).contains("이력서");
    }

    @Test
    @DisplayName("본문에 포함된 키워드로 검색되고 제목/본문 양쪽에 매칭돼도 중복 없이 한 번만 반환된다")
    void findByTitleContainingOrContentContaining_본문매칭() {
        Page<Question> page = questionRepository.findByTitleContainingOrContentContaining("stream", "stream", PageRequest.of(0, 10));

        assertThat(page.getTotalElements()).isEqualTo(2);
    }

    @Test
    @DisplayName("카테고리와 키워드를 동시에 만족하는 질문만 조회된다")
    void findByCategoryAndKeyword() {
        Page<Question> page = questionRepository.findByCategoryAndKeyword("개발", "시큐리티", PageRequest.of(0, 10));

        assertThat(page.getTotalElements()).isEqualTo(1);
        assertThat(page.getContent().get(0).getTitle()).contains("시큐리티");
    }

    @Test
    @DisplayName("매칭되는 질문이 없으면 빈 페이지를 반환한다")
    void findByCategory_결과없음_빈페이지() {
        Page<Question> page = questionRepository.findByCategory("디자인", PageRequest.of(0, 10));

        assertThat(page.getTotalElements()).isZero();
        assertThat(page.getContent()).isEmpty();
    }

    @Test
    @DisplayName("페이지 크기보다 뒤에 있는 페이지를 요청하면 빈 목록을 반환한다")
    void findByCategory_페이징경계() {
        Page<Question> page = questionRepository.findByCategory("개발", PageRequest.of(5, 10));

        assertThat(page.getContent()).isEmpty();
        assertThat(page.getTotalElements()).isEqualTo(2);
    }
}
