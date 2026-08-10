package com.example.findAnswer.dev.dto.oauth;

import java.util.List;

public record UserDisconnectEvent(
        Long userId,
        List<OAuthAccountSnapshot> oAuthAccounts
) {
}
