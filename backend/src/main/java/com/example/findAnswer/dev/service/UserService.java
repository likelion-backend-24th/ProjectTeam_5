package com.example.findAnswer.dev.service;

import com.example.findAnswer.dev.domain.Role;
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
import com.example.findAnswer.dev.exception.CustomException;
import com.example.findAnswer.dev.exception.ErrorCode;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenRepository refreshTokenRepository;

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
}
