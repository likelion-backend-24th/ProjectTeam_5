package com.example.findAnswer.mentorbridge.service;

import com.example.findAnswer.mentorbridge.constants.Role;
import com.example.findAnswer.mentorbridge.dto.user.TokenResponse;
import com.example.findAnswer.mentorbridge.entity.RefreshToken;
import com.example.findAnswer.mentorbridge.entity.User;
import com.example.findAnswer.mentorbridge.exception.CustomException;
import com.example.findAnswer.mentorbridge.constants.ErrorCode;
import com.example.findAnswer.mentorbridge.jwt.JwtTokenProvider;
import com.example.findAnswer.mentorbridge.repository.RefreshTokenRepository;
import com.example.findAnswer.mentorbridge.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.Base64;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;

    @Transactional
    public TokenResponse issueTokens(Long userId, String email, Role role) {
        String accessToken  = jwtTokenProvider.createAccessToken(userId, email, role);
        String refreshToken = jwtTokenProvider.createRefreshToken(userId);
        LocalDateTime expiresAt = LocalDateTime.now().plusDays(14);

        String hashedToken = hashToken(refreshToken);

        refreshTokenRepository.findByUserId(userId)
                .ifPresentOrElse(
                        existing -> existing.updateToken(hashedToken, expiresAt),
                        () -> refreshTokenRepository.save(new RefreshToken(userId, hashedToken, expiresAt))
                );

        return new TokenResponse(accessToken, refreshToken);
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

        RefreshToken saved = refreshTokenRepository.findByUserId(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.AUTH_REFRESH_INVALID));

        if (!saved.getToken().equals(hashToken(refreshToken))) {
            throw new CustomException(ErrorCode.AUTH_REFRESH_INVALID);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.AUTH_REFRESH_INVALID));

        String newAccessToken = jwtTokenProvider.createAccessToken(user.getId(), user.getEmail(), user.getRole());
        String newRefreshToken = jwtTokenProvider.createRefreshToken(user.getId());
        String newHashedToken = hashToken(newRefreshToken);
        saved.updateToken(newHashedToken, LocalDateTime.now().plusDays(14));

        return new TokenResponse(newAccessToken, newRefreshToken);
    }


    private String hashToken(String token) {
        try{
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e){
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

}
