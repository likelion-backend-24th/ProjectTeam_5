package com.example.findAnswer.dev.service;

import com.example.findAnswer.dev.domain.MentorApplicationStatus;
import com.example.findAnswer.dev.domain.Role;
import com.example.findAnswer.dev.dto.user.*;
import com.example.findAnswer.dev.dto.user.LoginRequest;
import com.example.findAnswer.dev.dto.user.SignupRequest;
import com.example.findAnswer.dev.dto.user.TokenResponse;
import com.example.findAnswer.dev.dto.user.UserResponse;
import com.example.findAnswer.dev.entity.MentorApplication;
import com.example.findAnswer.dev.entity.RefreshToken;
import com.example.findAnswer.dev.entity.User;
import com.example.findAnswer.dev.jwt.JwtTokenProvider;
import com.example.findAnswer.dev.repository.MentorApplicationRepository;
import com.example.findAnswer.dev.repository.RefreshTokenRepository;
import com.example.findAnswer.dev.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.findAnswer.dev.exception.CustomException;
import com.example.findAnswer.dev.exception.ErrorCode;

import java.time.LocalDateTime;
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
    public TokenResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new CustomException(ErrorCode.AUTH_INVALID_CREDENTIALS));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new CustomException(ErrorCode.AUTH_INVALID_CREDENTIALS);
        }

        String accessToken = jwtTokenProvider.createAccessToken(user.getId(), user.getEmail(), user.getRole());
        String refreshToken = jwtTokenProvider.createRefreshToken(user.getId());
        LocalDateTime expiresAt = LocalDateTime.now().plusDays(14);

        refreshTokenRepository.findById(user.getId())
                .ifPresentOrElse(
                        existing -> existing.updateToken(refreshToken, expiresAt),
                        () -> refreshTokenRepository.save(new RefreshToken(user.getId(), refreshToken, expiresAt))
                );

        return new TokenResponse(accessToken, refreshToken);
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
        user.updateProfile(request.getName());
        return UserResponse.from(user);
    }

    //회원탈퇴
    @Transactional
    public void deleteUser(Long userId) {
        User user = getUserById(userId);
        userRepository.delete(user);
    }

    //사용자 예외처리
    private User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
    }

    //토큰재발급
    @Transactional
    public TokenResponse reissue(String refreshToken) {
        if (refreshToken == null) {
            throw new CustomException(ErrorCode.AUTH_REFRESH_INVALID);
        }

        Long userId;
        try {
            userId = Long.valueOf(jwtTokenProvider.parseClaims(refreshToken).getSubject());
        } catch (Exception e) {
            throw new CustomException(ErrorCode.AUTH_REFRESH_INVALID);
        }

        RefreshToken saved = refreshTokenRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.AUTH_REFRESH_INVALID));

        if (!saved.getToken().equals(refreshToken)) {
            throw new CustomException(ErrorCode.AUTH_REFRESH_INVALID);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.AUTH_REFRESH_INVALID));

        String newAccessToken = jwtTokenProvider.createAccessToken(user.getId(), user.getEmail(), user.getRole());
        String newRefreshToken = jwtTokenProvider.createRefreshToken(user.getId());
        saved.updateToken(newRefreshToken, LocalDateTime.now().plusDays(14));

        return new TokenResponse(newAccessToken, newRefreshToken);
    }

    //로그아웃
    public void logout(String refreshToken) {
        if (refreshToken == null) {
            return;
        }
        Long userId;
        try {
            userId = Long.valueOf(jwtTokenProvider.parseClaims(refreshToken).getSubject());
        } catch (Exception e) {
            return;
        }
        refreshTokenRepository.deleteById(userId);
    }

    //멘토 신청
    @Transactional
    public void applyForMentor(Long userId) {
        User user = getUserById(userId);
        if (user.getRole() != Role.USER) {
            throw new CustomException(ErrorCode.VALIDATION_ERROR);
        }
        if (mentorApplicationRepository.existsByUser_IdAndStatus(userId, MentorApplicationStatus.PENDING)) {
            throw new CustomException(ErrorCode.VALIDATION_ERROR);
        }
        mentorApplicationRepository.save(new MentorApplication(user));
    }

    //멘토 신청 목록 조회 (관리자용)
    public List<UserResponse> getMentorApplications() {
        return mentorApplicationRepository.findByStatus(MentorApplicationStatus.PENDING).stream()
                .map(application -> UserResponse.from(application.getUser()))
                .toList();
    }

    //멘토 승인
    @Transactional
    public void approveMentor(Long userId) {
        MentorApplication application = mentorApplicationRepository.findByUser_IdAndStatus(userId, MentorApplicationStatus.PENDING)
                .orElseThrow(() -> new CustomException(ErrorCode.RESOURCE_NOT_FOUND));
        application.approve();
        application.getUser().promoteToMentor();
    }

    //멘토 거절
    @Transactional
    public void rejectMentor(Long userId) {
        MentorApplication application = mentorApplicationRepository.findByUser_IdAndStatus(userId, MentorApplicationStatus.PENDING)
                .orElseThrow(() -> new CustomException(ErrorCode.RESOURCE_NOT_FOUND));
        application.reject();
    }
}
