package com.example.findAnswer.dev.dto.user;

import com.example.findAnswer.dev.domain.Role;
import com.example.findAnswer.dev.entity.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Collection;
import java.util.List;
import java.util.Map;

public record CustomOAuth2User(Long userId, String email, Role role, Map<String, Object> attributes) implements OAuth2User {

    public static CustomOAuth2User from(User user, Map<String, Object> attributes) {
        return new CustomOAuth2User(user.getId(), user.getEmail(), user.getRole(), attributes);
    }

    @Override
    public Map<String, Object> getAttributes() {
        return attributes;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getName() {
        return String.valueOf(userId);   // 고유 식별자
    }
}