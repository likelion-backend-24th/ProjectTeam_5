package com.example.findAnswer.mentorbridge.service;

import com.example.findAnswer.mentorbridge.domain.Role;
import com.example.findAnswer.mentorbridge.dto.oauth.OAuthAccountSnapshot;
import com.example.findAnswer.mentorbridge.dto.oauth.UserDisconnectEvent;
import com.example.findAnswer.mentorbridge.dto.user.*;
import com.example.findAnswer.mentorbridge.dto.user.LoginRequest;
import com.example.findAnswer.mentorbridge.dto.user.SignupRequest;
import com.example.findAnswer.mentorbridge.dto.user.TokenResponse;
import com.example.findAnswer.mentorbridge.dto.user.UserResponse;
import com.example.findAnswer.mentorbridge.entity.User;
import com.example.findAnswer.mentorbridge.jwt.JwtTokenProvider;
import com.example.findAnswer.mentorbridge.repository.MentorApplicationRepository;
import com.example.findAnswer.mentorbridge.repository.OAuthAccountRepository;
import com.example.findAnswer.mentorbridge.repository.RefreshTokenRepository;
import com.example.findAnswer.mentorbridge.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.findAnswer.mentorbridge.exception.CustomException;
import com.example.findAnswer.mentorbridge.exception.ErrorCode;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenRepository refreshTokenRepository;
    private final MentorApplicationRepository mentorApplicationRepository;
    private final RefreshTokenService refreshTokenService;

    private final OAuthAccountRepository oAuthAccountRepository;

    // 탈퇴, 연결 해제 분리하기 위해 사용한다.
    private final ApplicationEventPublisher applicationEventPublisher;


    //회원가입
    @Transactional
    public UserResponse signup(SignupRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new CustomException(ErrorCode.EMAIL_DUPLICATE);
        }

        String encodedPassword = passwordEncoder.encode(request.getPassword());
        User user = new User(request.getEmail(), encodedPassword, request.getName(), Role.USER);
        userRepository.save(user);

        return UserResponse.from(user);
    }

    //로그인
    @Transactional // 리프레시 토큰 저장
    public TokenResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new CustomException(ErrorCode.AUTH_INVALID_CREDENTIALS));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new CustomException(ErrorCode.AUTH_INVALID_CREDENTIALS);
        }

        return refreshTokenService.issueTokens(user.getId(), user.getEmail(), user.getRole());
    }

    //프로필 조회
    public UserResponse getUserProfile(Long userId) {
        User user = getUserById(userId);
        return UserResponse.from(user);
    }

    //이메일 변경
    @Transactional
    public UserResponse updateEmail(Long userId, UserEmailUpdateRequest request) {
        User user = getUserById(userId);
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new CustomException(ErrorCode.EMAIL_DUPLICATE);
        }
        user.updateEmail(request.getEmail());
        return UserResponse.from(user);
    }

    //비밀번호 변경
    @Transactional
    public void updatePassword(Long userId, UserPasswordUpdateRequest request) {
        User user = getUserById(userId);
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new CustomException(ErrorCode.AUTH_INVALID_CREDENTIALS);
        }
        String encodedNewPassword = passwordEncoder.encode(request.getNewPassword());
        user.updatePassword(encodedNewPassword);
    }

    //이름 변경
    @Transactional
    public UserResponse updateProfile(Long userId, UserProfileUpdateRequest request) {
        User user = getUserById(userId);
        user.updateProfile(request.getName(), request.getInterests());
        return UserResponse.from(user);
    }

    //회원탈퇴
    @Transactional
    public void deleteUser(Long userId) {
        User user = getUserById(userId);

        // provider에 보낼 계정 정보
        List<OAuthAccountSnapshot> oAuthAccounts = oAuthAccountRepository.findAllByUserId(userId)
                .stream()
                .map(account -> new OAuthAccountSnapshot(account.getProvider().toString(), account.getProviderUserId()))
                .toList();

        mentorApplicationRepository.deleteByUserId(userId);
        refreshTokenRepository.deleteByUserId(userId);
        oAuthAccountRepository.deleteByUserId(userId); // DB에서 삭제
        userRepository.delete(user);

        // provider에 삭제 요청 보내야됨
        applicationEventPublisher.publishEvent(new UserDisconnectEvent(userId, oAuthAccounts));
    }

    //사용자 예외처리
    private User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
    }


    @Transactional // refreshTokenRepository.deleteById(userId);
    public void logout(String refreshToken) {
        if (refreshToken == null) {
            return;
        }
        long userId;
        try {
            userId = Long.parseLong(jwtTokenProvider.parseClaims(refreshToken).getSubject());
        } catch (Exception e) {
            return;
        }
        refreshTokenRepository.deleteByUserId(userId);
    }



}
