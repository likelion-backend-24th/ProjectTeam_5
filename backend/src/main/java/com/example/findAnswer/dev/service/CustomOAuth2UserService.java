package com.example.findAnswer.dev.service;

import com.example.findAnswer.dev.domain.Provider;
import com.example.findAnswer.dev.dto.user.AuthUser;
import com.example.findAnswer.dev.dto.user.CustomOAuth2User;
import com.example.findAnswer.dev.dto.user.OAuthUserInfo;
import com.example.findAnswer.dev.exception.OAuth2AuthException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final OAuthAccountService oAuthAccountService;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuthUser = super.loadUser(userRequest);

        Provider provider = Provider.valueOf(userRequest.getClientRegistration().getRegistrationId().toUpperCase(Locale.ROOT));

        OAuthUserInfo info = OAuthUserInfo.of(provider, oAuthUser.getAttributes());

        if(!info.emailVerified()){
            throw new OAuth2AuthException("이메일 인증이 필요합니다.");
        }

        AuthUser authUser = oAuthAccountService.loginOrCreate(provider, info);

        return new CustomOAuth2User(authUser.id(), authUser.email(), authUser.role(), oAuthUser.getAttributes());
    }
}
