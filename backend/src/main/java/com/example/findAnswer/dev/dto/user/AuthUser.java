package com.example.findAnswer.dev.dto.user;

import com.example.findAnswer.dev.domain.Role;

public record AuthUser(Long id, String email, Role role) {}