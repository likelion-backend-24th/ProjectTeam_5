package com.example.findAnswer.mentorbridge.client;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
@RequiredArgsConstructor
public class KakaoUnlinkClient {
    private static final String UNLINK_URL = "https://kapi.kakao.com/v1/user/unlink";

    @Value("${kakao.admin-key}")
    private String adminKey;

    private final RestClient restClient = RestClient.create();

    public void unlink(String kakaoUserId) {
        restClient.post().uri(UNLINK_URL)
                .header("Authorization", "KakaoAK  " + adminKey)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body("target_id_type=user_id&target_id=" + kakaoUserId)
                .retrieve()
                .toBodilessEntity();
    }

}
