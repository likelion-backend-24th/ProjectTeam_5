package com.example.findAnswer.dev.service;

import com.example.findAnswer.dev.domain.Provider;
import com.example.findAnswer.dev.domain.Role;
import com.example.findAnswer.dev.entity.OAuthAccount;
import com.example.findAnswer.dev.entity.User;
import com.example.findAnswer.dev.exception.OAuth2AuthException;
import com.example.findAnswer.dev.repository.OAuthAccountRepository;
import com.example.findAnswer.dev.repository.UserRepository;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class OAuthAccountService extends DefaultOAuth2UserService {

    private final OAuthAccountRepository oAuthAccountRepository;
    private final UserRepository userRepository;

    private static final int MAX_USERNAME_LENGTH = 50;

    @Transactional
    public OAuthAccount loginOrCreate(String providerUserId, String email, String name){
        return oAuthAccountRepository.findByProviderAndProviderUserId(Provider.GOOGLE, providerUserId)
                .orElseGet(() -> createAccount(providerUserId, email, name));
    }

    private OAuthAccount createAccount(String providerUserId, String email, String name){
        User user = userRepository.findByEmail(email).orElseGet(() -> userRepository.save(User.ofOAuth(email, name, Role.USER)));

        return oAuthAccountRepository.save(
                OAuthAccount.builder()
                .user(user)
                .providerUserId(providerUserId)
                .provider(Provider.GOOGLE)
                .build()
        );
    }

    @Override
    public OAuth2User loadUser(@NonNull OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        if (!Boolean.TRUE.equals(oAuth2User.<Boolean>getAttribute("email_verified"))) {
            throw new OAuth2AuthException("Google 이메일 인증이 필요합니다.");
        }

        String providerUserId = oAuth2User.getAttributes().get("sub").toString();
        String email = oAuth2User.getAttributes().get("email").toString();
        String name = oAuth2User.getAttributes().get("name").toString();

        oAuthAccountRepository
                .findByProviderAndProviderUserId(Provider.GOOGLE, providerUserId)
                .orElseGet(() -> createAccount(providerUserId, email, name));
        return oAuth2User;
    }
}
