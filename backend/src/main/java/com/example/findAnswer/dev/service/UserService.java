package com.example.findAnswer.dev.service;

import com.example.findAnswer.dev.domain.Role;
import com.example.findAnswer.dev.dto.user.*;
import com.example.findAnswer.dev.dto.user.LoginRequest;
import com.example.findAnswer.dev.dto.user.SignupRequest;
import com.example.findAnswer.dev.dto.user.TokenResponse;
import com.example.findAnswer.dev.dto.user.UserResponse;
import com.example.findAnswer.dev.entity.RefreshToken;
import com.example.findAnswer.dev.entity.User;
import com.example.findAnswer.dev.jwt.JwtTokenProvider;
import com.example.findAnswer.dev.repository.RefreshTokenRepository;
import com.example.findAnswer.dev.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.findAnswer.dev.exception.CustomException;
import com.example.findAnswer.dev.exception.ErrorCode;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenRepository refreshTokenRepository;

    //회원가입
    @Transactional
    public UserResponse signup(SignupRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new CustomException(ErrorCode.EMAIL_DUPLICATE);
        }
        if (request.getRole() == Role.ADMIN) {
            throw new CustomException(ErrorCode.VALIDATION_ERROR);
        }

        String encodedPassword = passwordEncoder.encode(request.getPassword());
        User user = new User(request.getEmail(), encodedPassword, request.getName(), request.getRole());
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
}
