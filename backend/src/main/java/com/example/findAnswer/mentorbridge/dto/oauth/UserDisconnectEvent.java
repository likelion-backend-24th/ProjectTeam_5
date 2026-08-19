package com.example.findAnswer.mentorbridge.dto.oauth;

import java.util.List;

public record UserDisconnectEvent(
        Long userId,
        List<OAuthAccountSnapshot> oAuthAccounts
) {
}
