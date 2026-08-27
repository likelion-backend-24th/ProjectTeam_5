package com.example.findAnswer.mentorbridge.service;

import com.example.findAnswer.mentorbridge.client.billing.PortOneBillingClient;
import com.example.findAnswer.mentorbridge.client.portone.PortOnePaymentClient;
import com.example.findAnswer.mentorbridge.client.portone.PortOnePaymentSnapshot;
import com.example.findAnswer.mentorbridge.constants.ErrorCode;
import com.example.findAnswer.mentorbridge.constants.PaymentMethodStatus;
import com.example.findAnswer.mentorbridge.constants.PaymentStatus;
import com.example.findAnswer.mentorbridge.constants.SubscriptionStatus;
import com.example.findAnswer.mentorbridge.entity.Payment;
import com.example.findAnswer.mentorbridge.entity.PaymentMethod;
import com.example.findAnswer.mentorbridge.entity.Subscription;
import com.example.findAnswer.mentorbridge.entity.User;
import com.example.findAnswer.mentorbridge.exception.CustomException;
import com.example.findAnswer.mentorbridge.repository.PaymentMethodRepository;
import com.example.findAnswer.mentorbridge.repository.PaymentRepository;
import com.example.findAnswer.mentorbridge.repository.PaymentTransactionRepository;
import com.example.findAnswer.mentorbridge.repository.SubscriptionRepository;
import com.example.findAnswer.mentorbridge.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

// 결제 확정(complete/webhook 공용 sync()) + 확정 직후 다음 회차 PortOne 예약 생성.
@ExtendWith(MockitoExtension.class)
@DisplayName("PaymentSyncService - 결제 확정 및 다음 회차 예약")
class PaymentSyncServiceTest {

    @Mock
    PaymentRepository paymentRepository;
    @Mock
    PaymentTransactionRepository paymentTransactionRepository;
    @Mock
    SubscriptionRepository subscriptionRepository;
    @Mock
    PaymentMethodRepository paymentMethodRepository;
    @Mock
    UserRepository userRepository;
    @Mock
    PortOnePaymentClient portOnePaymentClient;
    @Mock
    PortOneBillingClient portOneBillingClient;

    @InjectMocks
    PaymentSyncService paymentSyncService;

    private static final Long USER_ID = 1L;
    private static final Long SUBSCRIPTION_ID = 50L;
    private static final String PAYMENT_ID = "MB-1-abc";
    private static final String STORE_ID = "store-1";
    private static final String CHANNEL_KEY = "channel-1";

    private Payment payment;
    private Subscription subscription;
    private User user;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(paymentSyncService, "paymentIdPrefix", "MB");

        user = mock(User.class);
        given(user.getId()).willReturn(USER_ID);
        User mentor = mock(User.class);

        subscription = Subscription.builder()
                .user(user)
                .mentor(mentor)
                .status(SubscriptionStatus.PENDING)
                .amount(9900)
                .currentPeriodStart(LocalDateTime.now())
                .currentPeriodEnd(LocalDateTime.now())
                .build();
        ReflectionTestUtils.setField(subscription, "id", SUBSCRIPTION_ID);

        payment = Payment.builder()
                .paymentId(PAYMENT_ID)
                .subscription(subscription)
                .cycleNo(1)
                .attemptNo(1)
                .currency("KRW")
                .amount(9900L)
                .status(PaymentStatus.READY)
                .storeId(STORE_ID)
                .channelKey(CHANNEL_KEY)
                .build();

        given(paymentRepository.findByPaymentId(PAYMENT_ID)).willReturn(Optional.of(payment));
        given(subscriptionRepository.findById(SUBSCRIPTION_ID)).willReturn(Optional.of(subscription));
    }

    private PortOnePaymentSnapshot verifiedSnapshot() {
        return new PortOnePaymentSnapshot(PAYMENT_ID, "PAID", 9900L, "KRW", STORE_ID, CHANNEL_KEY, null);
    }

    @Test
    @DisplayName("PENDING 구독의 첫 결제가 검증되면 ACTIVE로 전환하고 다음 회차를 예약한다")
    void 첫결제_검증성공_ACTIVE전환_다음회차예약() {
        given(portOnePaymentClient.getPayment(PAYMENT_ID)).willReturn(verifiedSnapshot());

        PaymentMethod paymentMethod = PaymentMethod.builder()
                .id(10L)
                .paymentMethodStatus(PaymentMethodStatus.ACTIVE)
                .billingKey("billing-key-abc")
                .build();
        subscription.assignPaymentMethod(paymentMethod);

        given(user.getName()).willReturn("홍길동");
        given(user.getPhoneNumber()).willReturn("01012345678");
        given(user.getEmail()).willReturn("hong@example.com");

        given(paymentRepository.save(any(Payment.class))).willAnswer(invocation -> invocation.getArgument(0));
        given(portOneBillingClient.createSchedule(
                anyString(), anyString(), anyString(), anyString(), anyLong(), anyString(), any(), any(), any(), any()))
                .willReturn("schedule-123");

        paymentSyncService.complete(PAYMENT_ID, USER_ID);

        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(subscription.getStatus()).isEqualTo(SubscriptionStatus.ACTIVE);

        ArgumentCaptor<Payment> nextPaymentCaptor = ArgumentCaptor.forClass(Payment.class);
        verify(paymentRepository).save(nextPaymentCaptor.capture());
        Payment nextPayment = nextPaymentCaptor.getValue();
        assertThat(nextPayment.getCycleNo()).isEqualTo(2);
        assertThat(nextPayment.getStatus()).isEqualTo(PaymentStatus.READY);
        assertThat(nextPayment.getScheduleId()).isEqualTo("schedule-123");

        verify(portOneBillingClient).createSchedule(
                nextPayment.getPaymentId(), "billing-key-abc", CHANNEL_KEY, "정기결제 2회차",
                9900L, "KRW", subscription.getCurrentPeriodEnd(), "홍길동", "01012345678", "hong@example.com");
    }

    @Test
    @DisplayName("결제수단이 연결 안 된 구독은 결제가 확정돼도 다음 회차 예약을 건너뛴다")
    void 결제수단_없음_예약건너뜀() {
        given(portOnePaymentClient.getPayment(PAYMENT_ID)).willReturn(verifiedSnapshot());
        // subscription.paymentMethodId를 일부러 안 채운 상태(연결 안 된 구독)

        paymentSyncService.complete(PAYMENT_ID, USER_ID);

        assertThat(subscription.getStatus()).isEqualTo(SubscriptionStatus.ACTIVE);
        verify(paymentRepository, never()).save(any());
        verify(portOneBillingClient, never()).createSchedule(
                anyString(), anyString(), anyString(), anyString(), anyLong(), anyString(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("해지 예약된 구독은 결제가 확정돼도 다음 회차를 예약하지 않는다")
    void 해지예약_구독은_다음회차_예약안함() {
        subscription = Subscription.builder()
                .user(user)
                .mentor(mock(User.class))
                .status(SubscriptionStatus.CANCEL_RESERVED)
                .amount(9900)
                .currentPeriodStart(LocalDateTime.now())
                .currentPeriodEnd(LocalDateTime.now().plusDays(3))
                .build();
        ReflectionTestUtils.setField(subscription, "id", SUBSCRIPTION_ID);
        given(subscriptionRepository.findById(SUBSCRIPTION_ID)).willReturn(Optional.of(subscription));
        given(portOnePaymentClient.getPayment(PAYMENT_ID)).willReturn(verifiedSnapshot());

        paymentSyncService.complete(PAYMENT_ID, USER_ID);

        assertThat(subscription.getStatus()).isEqualTo(SubscriptionStatus.CANCEL_RESERVED);
        verify(portOneBillingClient, never()).createSchedule(
                anyString(), anyString(), anyString(), anyString(), anyLong(), anyString(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("검증 실패(금액 불일치)면 결제를 실패 처리하고 예외를 던지며 다음 회차도 예약하지 않는다")
    void 검증실패_결제실패처리() {
        PortOnePaymentSnapshot mismatched =
                new PortOnePaymentSnapshot(PAYMENT_ID, "PAID", 1234L, "KRW", STORE_ID, CHANNEL_KEY, null);
        given(portOnePaymentClient.getPayment(PAYMENT_ID)).willReturn(mismatched);

        assertThatThrownBy(() -> paymentSyncService.complete(PAYMENT_ID, USER_ID))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.PAYMENT_VERIFICATION_FAILED);

        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.FAILED);
        verify(portOneBillingClient, never()).createSchedule(
                anyString(), anyString(), anyString(), anyString(), anyLong(), anyString(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("이미 PAID인 결제는 재조회 없이 그대로 반환한다(멱등성)")
    void 이미_확정된_결제는_재조회안함() {
        payment.markPaidAt(LocalDateTime.now());
        subscription.activateAfterFirstPayment(LocalDateTime.now().plusMonths(1));

        paymentSyncService.complete(PAYMENT_ID, USER_ID);

        verify(portOnePaymentClient, never()).getPayment(anyString());
        verify(portOneBillingClient, never()).createSchedule(
                anyString(), anyString(), anyString(), anyString(), anyLong(), anyString(), any(), any(), any(), any());
    }
}
