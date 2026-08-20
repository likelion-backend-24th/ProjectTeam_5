package com.example.findAnswer.mentorbridge.service;

import com.example.findAnswer.mentorbridge.constants.Provider;
import com.example.findAnswer.mentorbridge.dto.oauth.AuthUser;
import com.example.findAnswer.mentorbridge.dto.oauth.CustomOAuth2User;
import com.example.findAnswer.mentorbridge.dto.oauth.OAuthUserInfo;
import com.example.findAnswer.mentorbridge.exception.OAuth2AuthException;
import com.example.findAnswer.mentorbridge.constants.OAuth2ErrorCode;
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

        if (info.email() != null && !info.emailVerified()) {
            throw new OAuth2AuthException(OAuth2ErrorCode.EMAIL_NOT_VERIFIED);
        }

        AuthUser authUser = oAuthAccountService.loginOrCreate(provider, info);

        if (authUser.isDeleted()) {
            throw new OAuth2AuthException(OAuth2ErrorCode.WITHDRAWN_USER);
        }

        if (authUser.isBlocked()) {
            throw new OAuth2AuthException(OAuth2ErrorCode.USER_BLOCKED);
        }

        return new CustomOAuth2User(authUser.id(), authUser.email(), authUser.role(), oAuthUser.getAttributes());
    }
}