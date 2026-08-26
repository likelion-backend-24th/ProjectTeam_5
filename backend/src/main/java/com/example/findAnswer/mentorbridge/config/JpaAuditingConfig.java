package com.example.findAnswer.mentorbridge.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

// @EnableJpaAuditing이 @SpringBootApplication 클래스에 직접 붙어 있으면 @WebMvcTest가
// 엔티티를 스캔하지 않은 채로 jpaAuditingHandler를 만들려다 "JPA metamodel must not be empty"로 깨진다.
// 별도 설정 클래스로 분리하면 @WebMvcTest의 제한된 컴포넌트 스캔 대상에서 제외되어 슬라이스 테스트가 정상 동작한다.
@Configuration
@EnableJpaAuditing
public class JpaAuditingConfig {
}
