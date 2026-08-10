package com.example.findAnswer.dev.listener;

import com.example.findAnswer.dev.client.KakaoUnlinkClient;
import com.example.findAnswer.dev.dto.oauth.UserDisconnectEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
@Slf4j
public class OAuthUnlinkListener {

    private final KakaoUnlinkClient kakaoUnlinkClient;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onUserWithdrawn(UserDisconnectEvent userDisconnectEvent) {
        for (var account: userDisconnectEvent.oAuthAccounts()){
            try{
                if ("kakao".equals(account.provider())){
                    kakaoUnlinkClient.unlink(account.providerUserId());
                }

                //구글은 refresh Token을 저장해야 할 수 있다. 처음 가입시 나오는 refreshToken
            } catch (Exception e){
                log.error("OAuth 연결 해제 실패");
            }
        }
    }

}
