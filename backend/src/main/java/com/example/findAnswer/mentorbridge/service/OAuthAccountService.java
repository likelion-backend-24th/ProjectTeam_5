package com.example.findAnswer.mentorbridge.service;

import com.example.findAnswer.mentorbridge.constants.Provider;
import com.example.findAnswer.mentorbridge.constants.Role;
import com.example.findAnswer.mentorbridge.dto.oauth.AuthUser;
import com.example.findAnswer.mentorbridge.dto.oauth.OAuthUserInfo;
import com.example.findAnswer.mentorbridge.entity.OAuthAccount;
import com.example.findAnswer.mentorbridge.entity.User;
import com.example.findAnswer.mentorbridge.repository.OAuthAccountRepository;
import com.example.findAnswer.mentorbridge.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OAuthAccountService {

    private final OAuthAccountRepository oAuthAccountRepository;
    private final UserRepository userRepository;

    @Transactional
    public AuthUser loginOrCreate(Provider provider, OAuthUserInfo info) {
        OAuthAccount oAuthAccount = oAuthAccountRepository
                .findByProviderAndProviderUserId(provider, info.providerUserId())
                .orElseGet(() -> createAccount(provider, info));

        User user = oAuthAccount.getUser();

        return new AuthUser(user.getId(), user.getEmail(), user.getRole(), user.isBlocked(), user.isDeleted());
    }

    private OAuthAccount createAccount(Provider provider, OAuthUserInfo info) {
        User user = findOrCreateUser(info);

        return oAuthAccountRepository.save(
                OAuthAccount.builder()
                        .user(user)
                        .provider(provider)
                        .providerUserId(info.providerUserId())
                        .build()
        );
    }

    private User findOrCreateUser(OAuthUserInfo info) {
        if (StringUtils.hasText(info.email())) {
            return userRepository.findByEmail(info.email())
                    .orElseGet(() -> userRepository.save(
                            User.ofOAuth(info.email(), info.name(), Role.USER)));
        }
        return userRepository.save(User.ofOAuth(null, info.name(), Role.USER));
    }
}