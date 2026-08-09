package com.example.findAnswer.dev.service;

import com.example.findAnswer.dev.domain.Provider;
import com.example.findAnswer.dev.domain.Role;
import com.example.findAnswer.dev.dto.user.AuthUser;
import com.example.findAnswer.dev.dto.user.OAuthUserInfo;
import com.example.findAnswer.dev.entity.OAuthAccount;
import com.example.findAnswer.dev.entity.User;
import com.example.findAnswer.dev.repository.OAuthAccountRepository;
import com.example.findAnswer.dev.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


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

        return new AuthUser(user.getId(), user.getEmail(), user.getRole());
    }

    private OAuthAccount createAccount(Provider provider, OAuthUserInfo info) {
        User user = userRepository.findByEmail(info.email())
                .orElseGet(() -> userRepository.save(
                        User.ofOAuth(info.email(), info.name(), Role.USER)));

        return oAuthAccountRepository.save(
                OAuthAccount.builder()
                        .user(user)
                        .provider(provider)
                        .providerUserId(info.providerUserId())
                        .build()
        );
    }
}