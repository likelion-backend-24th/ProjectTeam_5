package com.example.findAnswer.mentorbridge.service;

import com.example.findAnswer.mentorbridge.constants.ErrorCode;
import com.example.findAnswer.mentorbridge.constants.Role;
import com.example.findAnswer.mentorbridge.dto.user.LoginRequest;
import com.example.findAnswer.mentorbridge.dto.user.SignupRequest;
import com.example.findAnswer.mentorbridge.dto.user.TokenResponse;
import com.example.findAnswer.mentorbridge.dto.user.UserPasswordUpdateRequest;
import com.example.findAnswer.mentorbridge.dto.oauth.UserDisconnectEvent;
import com.example.findAnswer.mentorbridge.dto.user.UserResponse;
import com.example.findAnswer.mentorbridge.entity.User;
import com.example.findAnswer.mentorbridge.exception.CustomException;
import com.example.findAnswer.mentorbridge.repository.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserService 단위 테스트")
class UserServiceTest {

    @Mock UserRepository userRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock com.example.findAnswer.mentorbridge.jwt.JwtTokenProvider jwtTokenProvider;
    @Mock RefreshTokenRepository refreshTokenRepository;
    @Mock RefreshTokenService refreshTokenService;
    @Mock OAuthAccountRepository oAuthAccountRepository;
    @Mock ApplicationEventPublisher applicationEventPublisher;
    @Mock FollowRepository followRepository;
    @Mock EmailVerificationRepository emailVerificationRepository;
    @Mock EmailService emailService;
    @Mock MentorApplicationRepository mentorApplicationRepository;

    @InjectMocks
    UserService userService;

    private static final Long USER_ID = 1L;

    private User newUser(String email, String encodedPassword) {
        User user = new User(email, encodedPassword, "테스터", Role.USER);
        ReflectionTestUtils.setField(user, "id", USER_ID);
        return user;
    }

    private SignupRequest signupRequest(String email, String password, String name) {
        SignupRequest request = new SignupRequest();
        ReflectionTestUtils.setField(request, "email", email);
        ReflectionTestUtils.setField(request, "password", password);
        ReflectionTestUtils.setField(request, "name", name);
        return request;
    }

    private LoginRequest loginRequest(String email, String password) {
        LoginRequest request = new LoginRequest();
        ReflectionTestUtils.setField(request, "email", email);
        ReflectionTestUtils.setField(request, "password", password);
        return request;
    }

    private UserPasswordUpdateRequest passwordUpdateRequest(String current, String newPassword) {
        UserPasswordUpdateRequest request = new UserPasswordUpdateRequest();
        ReflectionTestUtils.setField(request, "currentPassword", current);
        ReflectionTestUtils.setField(request, "newPassword", newPassword);
        return request;
    }

    @Test
    @DisplayName("가입 이력 없는 이메일이면 회원가입에 성공한다")
    void signup_성공() {
        given(userRepository.existsByEmail("new@test.com")).willReturn(false);
        given(passwordEncoder.encode("password123")).willReturn("encoded-password");

        UserResponse response = userService.signup(signupRequest("new@test.com", "password123", "새유저"));

        assertThat(response.getEmail()).isEqualTo("new@test.com");
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    @DisplayName("이미 가입된 이메일이면 EMAIL_DUPLICATE 예외가 발생하고 저장을 시도하지 않는다")
    void signup_이메일중복_실패() {
        given(userRepository.existsByEmail("dup@test.com")).willReturn(true);

        assertThatThrownBy(() -> userService.signup(signupRequest("dup@test.com", "password123", "중복유저")))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.EMAIL_DUPLICATE);

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("이메일과 비밀번호가 일치하면 로그인에 성공해 토큰을 발급한다")
    void login_성공() {
        User user = newUser("login@test.com", "encoded-password");
        given(userRepository.findByEmail("login@test.com")).willReturn(Optional.of(user));
        given(passwordEncoder.matches("password123", "encoded-password")).willReturn(true);
        TokenResponse tokenResponse = new TokenResponse("access-token", "refresh-token");
        given(refreshTokenService.issueTokens(USER_ID, "login@test.com", Role.USER)).willReturn(tokenResponse);

        TokenResponse result = userService.login(loginRequest("login@test.com", "password123"));

        assertThat(result.getAccessToken()).isEqualTo("access-token");
    }

    @Test
    @DisplayName("비밀번호가 일치하지 않으면 AUTH_INVALID_CREDENTIALS 예외가 발생한다")
    void login_비밀번호불일치_실패() {
        User user = newUser("login@test.com", "encoded-password");
        given(userRepository.findByEmail("login@test.com")).willReturn(Optional.of(user));
        given(passwordEncoder.matches("wrong-password", "encoded-password")).willReturn(false);

        assertThatThrownBy(() -> userService.login(loginRequest("login@test.com", "wrong-password")))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.AUTH_INVALID_CREDENTIALS);
    }

    @Test
    @DisplayName("존재하지 않는 이메일로 로그인하면 AUTH_INVALID_CREDENTIALS 예외가 발생한다")
    void login_존재하지않는이메일_실패() {
        given(userRepository.findByEmail("nobody@test.com")).willReturn(Optional.empty());

        assertThatThrownBy(() -> userService.login(loginRequest("nobody@test.com", "password123")))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.AUTH_INVALID_CREDENTIALS);
    }

    @Test
    @DisplayName("탈퇴한 계정으로 로그인하면 USER_DELETED 예외가 발생한다")
    void login_탈퇴계정_실패() {
        User user = newUser("deleted@test.com", "encoded-password");
        // softDelete()는 password/email까지 null로 지워버려서 matches() 스텁 인자와 어긋난다.
        // 여기서는 "탈퇴했지만 비밀번호는 그대로"인 상태만 재현하면 되므로 deletedAt만 직접 세팅한다.
        ReflectionTestUtils.setField(user, "deletedAt", java.time.LocalDateTime.now());
        given(userRepository.findByEmail("deleted@test.com")).willReturn(Optional.of(user));
        given(passwordEncoder.matches("password123", "encoded-password")).willReturn(true);

        assertThatThrownBy(() -> userService.login(loginRequest("deleted@test.com", "password123")))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.USER_DELETED);
    }

    @Test
    @DisplayName("차단된 계정으로 로그인하면 USER_BLOCKED 예외가 발생한다")
    void login_차단계정_실패() {
        User user = newUser("blocked@test.com", "encoded-password");
        user.block();
        given(userRepository.findByEmail("blocked@test.com")).willReturn(Optional.of(user));
        given(passwordEncoder.matches("password123", "encoded-password")).willReturn(true);

        assertThatThrownBy(() -> userService.login(loginRequest("blocked@test.com", "password123")))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.USER_BLOCKED);
    }

    @Test
    @DisplayName("현재 비밀번호가 일치하면 비밀번호를 변경한다")
    void updatePassword_성공() {
        User user = newUser("pw@test.com", "encoded-old");
        given(userRepository.findById(USER_ID)).willReturn(Optional.of(user));
        given(passwordEncoder.matches("old-password", "encoded-old")).willReturn(true);
        given(passwordEncoder.encode("new-password")).willReturn("encoded-new");

        userService.updatePassword(USER_ID, passwordUpdateRequest("old-password", "new-password"));

        assertThat(user.getPassword()).isEqualTo("encoded-new");
    }

    @Test
    @DisplayName("현재 비밀번호가 일치하지 않으면 비밀번호가 변경되지 않는다")
    void updatePassword_현재비밀번호불일치_실패() {
        User user = newUser("pw@test.com", "encoded-old");
        given(userRepository.findById(USER_ID)).willReturn(Optional.of(user));
        given(passwordEncoder.matches("wrong-password", "encoded-old")).willReturn(false);

        assertThatThrownBy(() -> userService.updatePassword(USER_ID, passwordUpdateRequest("wrong-password", "new-password")))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.PASSWORD_MISMATCH);

        assertThat(user.getPassword()).isEqualTo("encoded-old");
    }

    @Test
    @DisplayName("자기 자신을 팔로우하려 하면 INVALID_REQUEST 예외가 발생한다")
    void toggleFollow_자기자신_실패() {
        assertThatThrownBy(() -> userService.toggleFollow(USER_ID, USER_ID))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_REQUEST);

        verify(followRepository, never()).save(any());
    }

    @Test
    @DisplayName("이미 탈퇴한 계정을 다시 탈퇴 처리해도 아무 일도 일어나지 않는다")
    void deleteUser_이미탈퇴_아무일도안함() {
        User user = newUser("already-deleted@test.com", "encoded");
        user.softDelete();
        given(userRepository.findById(USER_ID)).willReturn(Optional.of(user));

        userService.deleteUser(USER_ID);

        verify(refreshTokenRepository, never()).deleteByUserId(anyLong());
        verify(applicationEventPublisher, never()).publishEvent(any());
    }

    @Test
    @DisplayName("탈퇴하면 소프트 삭제 처리되고 연결된 OAuth 해제 이벤트가 발행된다")
    void deleteUser_성공() {
        User user = newUser("active@test.com", "encoded");
        given(userRepository.findById(USER_ID)).willReturn(Optional.of(user));
        given(oAuthAccountRepository.findAllByUserId(USER_ID)).willReturn(List.of());

        userService.deleteUser(USER_ID);

        assertThat(user.isDeleted()).isTrue();
        verify(refreshTokenRepository, times(1)).deleteByUserId(USER_ID);
        // ApplicationEventPublisher는 publishEvent(ApplicationEvent)/(Object) 오버로드가 있어
        // any()만 쓰면 실제 호출(Object 오버로드)과 다른 오버로드를 검증하게 될 수 있다 — 타입을 명시한다.
        verify(applicationEventPublisher, times(1)).publishEvent(any(UserDisconnectEvent.class));
    }
}
