package com.example.findAnswer.dev.dto.user;

import com.example.findAnswer.dev.domain.Provider;

import java.util.Map;

public record OAuthUserInfo(String providerUserId, String email, String name, boolean emailVerified) {

    public static OAuthUserInfo of(Provider provider, Map<String, Object> attributes) {
        return switch (provider) {
            case GOOGLE -> ofGoogle(attributes);
            case KAKAO -> ofKakao(attributes);
            case NAVER -> ofNaver(attributes);
        };
    }

    private static OAuthUserInfo ofGoogle(Map<String, Object> info) {
        return new OAuthUserInfo(
                (String) info.get("sub"),
                (String) info.get("email"),
                (String) info.get("name"),
                Boolean.TRUE.equals(info.get("email_verified")));
    }

    private static OAuthUserInfo ofKakao(Map<String, Object> info) {
        Map<String, Object> account = (Map<String, Object>) info.get("kakao_account");
        Map<String, Object> profile = (Map<String, Object>) account.get("profile");
        return new OAuthUserInfo(
                String.valueOf(info.get("id")),
                (String) account.get("email"),          // null 가능
                (String) profile.get("nickname"),
                Boolean.TRUE.equals(account.get("is_email_verified")));
    }

    private static  OAuthUserInfo ofNaver(Map<String, Object> info) {
        Boolean emailVerified = Boolean.FALSE;
        if(info.get("email") != null) {
            emailVerified = Boolean.TRUE;
        }
        return new OAuthUserInfo(
                (String) info.get("id"),
                (String) info.get("email"),
                (String) info.get("nickname"),
                emailVerified
//                Boolean.TRUE.equals(info.get("is_email_verified")) // 이메일 검증 필드 없음
        );
    }

}