package com.example.findAnswer.mentorbridge.service;

import com.example.findAnswer.mentorbridge.constants.Role;
import com.example.findAnswer.mentorbridge.dto.oauth.OAuthAccountSnapshot;
import com.example.findAnswer.mentorbridge.dto.oauth.UserDisconnectEvent;
import com.example.findAnswer.mentorbridge.dto.user.*;
import com.example.findAnswer.mentorbridge.entity.User;
import com.example.findAnswer.mentorbridge.exception.CustomException;
import com.example.findAnswer.mentorbridge.constants.ErrorCode;
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
    private final ApplicationEventPublisher applicationEventPublisher;

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

    @Transactional
    public TokenResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new CustomException(ErrorCode.AUTH_INVALID_CREDENTIALS));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new CustomException(ErrorCode.AUTH_INVALID_CREDENTIALS);
        }

        if (user.isBlocked()) {
            throw new CustomException(ErrorCode.USER_BLOCKED);
        }

        return refreshTokenService.issueTokens(user.getId(), user.getEmail(), user.getRole());
    }

    public UserResponse getUserProfile(Long userId) {
        User user = getUserById(userId);
        return UserResponse.from(user);
    }

    @Transactional
    public UserResponse updateEmail(Long userId, UserEmailUpdateRequest request) {
        User user = getUserById(userId);
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new CustomException(ErrorCode.EMAIL_DUPLICATE);
        }
        user.updateEmail(request.getEmail());
        return UserResponse.from(user);
    }

    @Transactional
    public void updatePassword(Long userId, UserPasswordUpdateRequest request) {
        User user = getUserById(userId);
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new CustomException(ErrorCode.AUTH_INVALID_CREDENTIALS);
        }
        String encodedNewPassword = passwordEncoder.encode(request.getNewPassword());
        user.updatePassword(encodedNewPassword);
    }

    @Transactional
    public UserResponse updateProfile(Long userId, UserProfileUpdateRequest request) {
        User user = getUserById(userId);
        user.updateProfile(request.getName(), request.getInterests());
        return UserResponse.from(user);
    }

    @Transactional
    public void deleteUser(Long userId) {
        User user = getUserById(userId);

        List<OAuthAccountSnapshot> oAuthAccounts = oAuthAccountRepository.findAllByUserId(userId)
                .stream()
                .map(account -> new OAuthAccountSnapshot(account.getProvider().toString(), account.getProviderUserId()))
                .toList();

        mentorApplicationRepository.deleteByUser_Id(userId);
        refreshTokenRepository.deleteByUserId(userId);
        oAuthAccountRepository.deleteByUserId(userId);
        userRepository.delete(user);

        applicationEventPublisher.publishEvent(new UserDisconnectEvent(userId, oAuthAccounts));
    }

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserResponse::from)
                .toList();
    }

    @Transactional
    public void blockUser(Long userId) {
        User user = getUserById(userId);
        user.block();
        refreshTokenRepository.deleteByUserId(userId);
    }

    @Transactional
    public void unblockUser(Long userId) {
        User user = getUserById(userId);
        user.unblock();
    }

    @Transactional
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

    private User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
    }
}