package com.example.findAnswer.mentorbridge.service;

import com.example.findAnswer.mentorbridge.client.billing.PortOneBillingClient;
import com.example.findAnswer.mentorbridge.constants.PaymentStatus;
import com.example.findAnswer.mentorbridge.constants.SubscriptionStatus;
import com.example.findAnswer.mentorbridge.entity.Payment;
import com.example.findAnswer.mentorbridge.entity.Subscription;
import com.example.findAnswer.mentorbridge.entity.User;
import com.example.findAnswer.mentorbridge.repository.PaymentRepository;
import com.example.findAnswer.mentorbridge.repository.SubscriptionRepository;
import com.example.findAnswer.mentorbridge.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

// 구독 해지 — 다음 회차로 예약해둔 PortOne 결제도 같이 취소돼야 한다(안 그러면 해지해도 다음 달에 청구됨).
@ExtendWith(MockitoExtension.class)
@DisplayName("SubscriptionService - 구독 해지")
class SubscriptionServiceTest {

    @Mock
    SubscriptionRepository subscriptionRepository;
    @Mock
    UserRepository userRepository;
    @Mock
    PaymentRepository paymentRepository;
    @Mock
    PortOneBillingClient portOneBillingClient;

    @InjectMocks
    SubscriptionService subscriptionService;

    private static final Long USER_ID = 1L;
    private static final Long SUBSCRIPTION_ID = 50L;

    private Subscription subscription;

    @BeforeEach
    void setUp() {
        User user = mock(User.class);
        given(user.getId()).willReturn(USER_ID);

        subscription = Subscription.builder()
                .user(user)
                .mentor(mock(User.class))
                .status(SubscriptionStatus.ACTIVE)
                .amount(9900)
                .currentPeriodStart(LocalDateTime.now())
                .currentPeriodEnd(LocalDateTime.now().plusDays(20))
                .build();
        ReflectionTestUtils.setField(subscription, "id", SUBSCRIPTION_ID);
        given(subscriptionRepository.findById(SUBSCRIPTION_ID)).willReturn(Optional.of(subscription));
    }

    @Test
    @DisplayName("예약된 다음 회차가 있으면 PortOne 예약을 취소하고 구독을 해지 예약 처리한다")
    void 예약된_다음회차_취소_후_해지예약() {
        Payment nextPayment = Payment.builder()
                .paymentId("MB-2-def")
                .subscription(subscription)
                .cycleNo(2)
                .attemptNo(1)
                .currency("KRW")
                .amount(9900L)
                .status(PaymentStatus.READY)
                .scheduleId("schedule-123")
                .build();
        given(paymentRepository.findFirstBySubscriptionIdAndStatusOrderByCycleNoDesc(SUBSCRIPTION_ID, PaymentStatus.READY))
                .willReturn(Optional.of(nextPayment));

        subscriptionService.cancelSubscription(USER_ID, SUBSCRIPTION_ID);

        verify(portOneBillingClient).cancelSchedule("schedule-123");
        assertThat(subscription.getStatus()).isEqualTo(SubscriptionStatus.CANCEL_RESERVED);
    }

    @Test
    @DisplayName("예약된 다음 회차가 없으면 PortOne 예약취소를 호출하지 않는다")
    void 예약없으면_취소API_호출안함() {
        given(paymentRepository.findFirstBySubscriptionIdAndStatusOrderByCycleNoDesc(SUBSCRIPTION_ID, PaymentStatus.READY))
                .willReturn(Optional.empty());

        subscriptionService.cancelSubscription(USER_ID, SUBSCRIPTION_ID);

        verify(portOneBillingClient, never()).cancelSchedule(org.mockito.ArgumentMatchers.anyString());
        assertThat(subscription.getStatus()).isEqualTo(SubscriptionStatus.CANCEL_RESERVED);
    }

    @Test
    @DisplayName("본인 구독이 아니면 해지할 수 없다")
    void 본인구독_아니면_거절() {
        Long otherUserId = 999L;

        assertThatThrownBy(() -> subscriptionService.cancelSubscription(otherUserId, SUBSCRIPTION_ID))
                .isInstanceOf(IllegalArgumentException.class);

        verify(paymentRepository, never())
                .findFirstBySubscriptionIdAndStatusOrderByCycleNoDesc(org.mockito.ArgumentMatchers.anyLong(), org.mockito.ArgumentMatchers.any());
        assertThat(subscription.getStatus()).isEqualTo(SubscriptionStatus.ACTIVE);
    }
}
