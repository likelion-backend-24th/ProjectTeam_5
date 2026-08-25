package com.example.findAnswer.mentorbridge.config;


import com.example.findAnswer.mentorbridge.handler.OAuth2FailureHandler;
import com.example.findAnswer.mentorbridge.handler.OAuth2SuccessHandler;
import com.example.findAnswer.mentorbridge.jwt.JwtAuthenticationFilter;
import com.example.findAnswer.mentorbridge.jwt.JwtTokenProvider;
import com.example.findAnswer.mentorbridge.service.CustomOAuth2UserService;
import lombok.RequiredArgsConstructor;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity // AdminController의 @PreAuthorize가 URL 패턴 매칭과 별개로 한 번 더 걸리게 한다(10번 항목)
@RequiredArgsConstructor
public class SecurityConfig {
    private final JwtTokenProvider jwtTokenProvider;


    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(
            HttpSecurity http,
            CustomOAuth2UserService customOAuth2UserService,
            OAuth2FailureHandler oAuth2FailureHandler,
            OAuth2SuccessHandler oAuth2SuccessHandler) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED) // oAuth 로그인 state 파라미터 검증에 세션이 필요
                )

                // 인증 실패 시 OAuth 로그인으로 302 리다이렉트하지 않고 401을 반환한다.
                // (SPA + JWT 구조 — 리다이렉트하면 fetch가 루프에 빠져 ERR_TOO_MANY_REDIRECTS 발생)
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) ->
                                response.sendError(HttpServletResponse.SC_UNAUTHORIZED))
                )

                //API 명세서 기준 접근 권한 설정
                .authorizeHttpRequests(auth -> auth

                        .requestMatchers("/api/auth/signup", "/api/auth/login", "/api/auth/refresh").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/questions/**").permitAll()
                        // 멘토 대시보드는 "내(로그인한 멘토)" 개인 데이터라 인증 필요 — 아래 /api/mentors/** permitAll보다
                        // 먼저 와야 한다(스프링 시큐리티는 먼저 매칭되는 규칙을 씀).
                        .requestMatchers(HttpMethod.GET, "/api/mentors/me/dashboard/**").authenticated()
                        // 멘토 목록/상세/리뷰는 구독 여부와 상관없이 공개 — 구독 안 한 사람도 보고 판단할 수 있어야 한다.
                        // POST/PUT/DELETE(프로필 수정, 리뷰 작성/삭제 등)는 이 규칙에 안 걸리고 그대로 인증 필요.
                        .requestMatchers(HttpMethod.GET, "/api/mentors/**").authenticated()
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll() // "/h2-console/**" 제거
                        .requestMatchers("/", "/health").permitAll()
                        .requestMatchers("/error").permitAll()
                        .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/users").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/questions/user/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/users/{userId}").permitAll()
                        .requestMatchers("/api/v1/webhooks/**").permitAll() // 웹훅 설정 인증은 서명으로 대체
                        // 1:1 문의는 전역 Footer에 있어 로그인 페이지에서도 열린다.
                        // 로그인을 못 해서 문의하려는 사람이 정확히 막히면 안 된다.
                        .requestMatchers(HttpMethod.POST, "/api/v1/inquiries").permitAll()
                        .anyRequest().authenticated()
                )
                //OAuth 로그인 설정
                .oauth2Login(oauth2 -> oauth2
                        .userInfoEndpoint(endpoint -> endpoint.userService(customOAuth2UserService))
                        .failureHandler(oAuth2FailureHandler)
                        .successHandler(oAuth2SuccessHandler)
                )

                //커스텀 JWT 필터를 UsernamePasswordAuthenticationFilter 전에 실행되도록 등록
                .addFilterBefore(new JwtAuthenticationFilter(jwtTokenProvider), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }


    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOrigins(List.of(
                "http://localhost:3000",
                "https://like-lion-team5-find-answer.vercel.app"
        ));

        configuration.setAllowedMethods(List.of(
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE",
                "OPTIONS"
        ));

        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of(
                "Authorization"
        ));

        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}
