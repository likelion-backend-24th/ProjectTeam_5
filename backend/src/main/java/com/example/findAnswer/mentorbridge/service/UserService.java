package com.example.findAnswer.mentorbridge.service;

import com.example.findAnswer.mentorbridge.constants.ErrorCode;
import com.example.findAnswer.mentorbridge.constants.Role;
import com.example.findAnswer.mentorbridge.dto.oauth.OAuthAccountSnapshot;
import com.example.findAnswer.mentorbridge.dto.oauth.UserDisconnectEvent;
import com.example.findAnswer.mentorbridge.dto.user.*;
import com.example.findAnswer.mentorbridge.entity.EmailVerification;
import com.example.findAnswer.mentorbridge.entity.Follow;
import com.example.findAnswer.mentorbridge.entity.User;
import com.example.findAnswer.mentorbridge.exception.CustomException;
import com.example.findAnswer.mentorbridge.jwt.JwtTokenProvider;
import com.example.findAnswer.mentorbridge.repository.*;
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
    private final FollowRepository followRepository;
    private final EmailVerificationRepository emailVerificationRepository;
    private final EmailService emailService;

    // 회원가입
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

    // 로그인
    @Transactional
    public TokenResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new CustomException(ErrorCode.AUTH_INVALID_CREDENTIALS));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new CustomException(ErrorCode.AUTH_INVALID_CREDENTIALS);
        }

        // 차단된 유저 체크
        if (user.isBlocked()) {
            throw new CustomException(ErrorCode.USER_BLOCKED);
        }

        return refreshTokenService.issueTokens(user.getId(), user.getEmail(), user.getRole());
    }

    // 프로필 조회
    public UserResponse getUserProfile(Long userId) {
        User user = getUserById(userId);
        return UserResponse.from(user);
    }

    // 이메일 변경
    @Transactional
    public UserResponse updateEmail(Long userId, UserEmailUpdateRequest request) {
        User user = getUserById(userId);
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new CustomException(ErrorCode.EMAIL_DUPLICATE);
        }
        user.updateEmail(request.getEmail());
        return UserResponse.from(user);
    }

    // 비밀번호 변경
    @Transactional
    public void updatePassword(Long userId, UserPasswordUpdateRequest request) {
        User user = getUserById(userId);
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new CustomException(ErrorCode.AUTH_INVALID_CREDENTIALS);
        }
        String encodedNewPassword = passwordEncoder.encode(request.getNewPassword());
        user.updatePassword(encodedNewPassword);
    }

    // 이름/관심사 변경
    @Transactional
    public UserResponse updateProfile(Long userId, UserProfileUpdateRequest request) {
        User user = getUserById(userId);
        user.updateProfile(request.getName(), request.getInterests());
        return UserResponse.from(user);
    }

    // 회원 탈퇴 / 회원 강제 삭제
    @Transactional
    public void deleteUser(Long userId) {
        User user = getUserById(userId);

        List<OAuthAccountSnapshot> oAuthAccounts = oAuthAccountRepository.findAllByUserId(userId)
                .stream()
                .map(account -> new OAuthAccountSnapshot(account.getProvider().toString(), account.getProviderUserId()))
                .toList();

        mentorApplicationRepository.deleteByUserId(userId);
        refreshTokenRepository.deleteByUserId(userId);
        oAuthAccountRepository.deleteByUserId(userId);
        emailVerificationRepository.deleteByUserId(userId);
        userRepository.delete(user);

        applicationEventPublisher.publishEvent(new UserDisconnectEvent(userId, oAuthAccounts));
    }

    // 공개 프로필 정보 업데이트
    @Transactional
    public UserResponse updatePublicProfile(Long userId, PublicProfileUpdateRequest request) {
        User user = getUserById(userId);
        user.updatePublicProfile(
                request.getBio(),
                request.getCareers(),
                request.getDescription(),
                request.getLocation(),
                request.getTags()
        );
        return UserResponse.from(user);
    }

    // 프로필 이미지 URL 업데이트
    @Transactional
    public UserResponse updateProfileImage(Long userId, ProfileImageUpdateRequest request) {
        User user = getUserById(userId);
        user.updateProfileImage(request.getProfileImageUrl());
        return UserResponse.from(user);
    }

    // 특정 유저 공개 조회 (다른 유저가 볼 때)
    public UserResponse getPublicProfile(Long targetUserId, Long currentUserId) {
        User user = getUserById(targetUserId);
        UserResponse response = UserResponse.from(user);

        long followers = followRepository.countByFolloweeId(targetUserId);
        long followings = followRepository.countByFollowerId(targetUserId);
        boolean isFollowing = false;

        if (currentUserId != null) {
            isFollowing = followRepository.existsByFollowerIdAndFolloweeId(currentUserId, targetUserId);
        }

        response.setFollowStats(followers, followings, isFollowing);
        return response;
    }

    // [관리자] 전체 회원 목록 조회
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserResponse::from)
                .toList();
    }

    // [관리자] 회원 차단
    @Transactional
    public void blockUser(Long userId) {
        User user = getUserById(userId);
        user.block();
        // 즉시 로그아웃 효과 (토큰 재발급 방지)
        refreshTokenRepository.deleteByUserId(userId);
    }

    // [관리자] 회원 차단 해제
    @Transactional
    public void unblockUser(Long userId) {
        User user = getUserById(userId);
        user.unblock();
    }

    // 로그아웃
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

    // 사용자 예외처리 공통 메서드
    private User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
    }

    @Transactional
    public void toggleFollow(Long followerId, Long followeeId) {
        if (followerId.equals(followeeId)) {
            throw new CustomException(ErrorCode.INVALID_REQUEST);
        }
        User follower = getUserById(followerId);
        User followee = getUserById(followeeId);

        // 이미 팔로우 중이면 삭제, 아니면 생성
        followRepository.findByFollowerIdAndFolloweeId(followerId, followeeId)
                .ifPresentOrElse(
                        followRepository::delete,
                        () -> followRepository.save(new Follow(follower, followee))
                );
    }

    //인증 이메일 발송
    @Transactional
    public void sendVerificationCode(Long userId, EmailVerificationRequest request) {
        String email = request.email();
        String code = String.format("%06d", new java.util.Random().nextInt(1000000));
        java.time.LocalDateTime expiresAt = java.time.LocalDateTime.now().plusMinutes(5);

        emailVerificationRepository.deleteByUserId(userId);
        emailVerificationRepository.save(new EmailVerification(userId, email, code, expiresAt));
        emailService.sendVerificationEmail(email, code); // 실제 메일 발송!
    }

    //인증번호 확인
    @Transactional
    public UserResponse verifyEmailCode(Long userId, EmailVerificationSubmitRequest request) {
        EmailVerification verification = emailVerificationRepository.findByUserIdAndEmail(userId, request.email())
                .orElseThrow(() -> new CustomException(ErrorCode.INVALID_REQUEST));

        if (verification.getExpiresAt().isBefore(java.time.LocalDateTime.now())) {
            throw new CustomException(ErrorCode.INVALID_REQUEST);
        }
        if (!verification.getCode().equals(request.code())) {
            throw new CustomException(ErrorCode.INVALID_REQUEST);
        }

        User user = getUserById(userId);
        user.updateEmail(request.email());
        user.verifyEmail();

        emailVerificationRepository.delete(verification);
        return UserResponse.from(user);
    }

}