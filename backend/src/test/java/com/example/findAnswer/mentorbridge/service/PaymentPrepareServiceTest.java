package com.example.findAnswer.mentorbridge.service;

import com.example.findAnswer.mentorbridge.client.billing.PortOneBillingClient;
import com.example.findAnswer.mentorbridge.constants.ErrorCode;
import com.example.findAnswer.mentorbridge.constants.PaymentMethodStatus;
import com.example.findAnswer.mentorbridge.constants.PaymentStatus;
import com.example.findAnswer.mentorbridge.constants.SubscriptionStatus;
import com.example.findAnswer.mentorbridge.dto.payment.PaymentCompleteResponse;
import com.example.findAnswer.mentorbridge.entity.MentorPlan;
import com.example.findAnswer.mentorbridge.entity.Payment;
import com.example.findAnswer.mentorbridge.entity.PaymentMethod;
import com.example.findAnswer.mentorbridge.entity.Subscription;
import com.example.findAnswer.mentorbridge.entity.User;
import com.example.findAnswer.mentorbridge.exception.CustomException;
import com.example.findAnswer.mentorbridge.repository.MentorPlanRepository;
import com.example.findAnswer.mentorbridge.repository.PaymentMethodRepository;
import com.example.findAnswer.mentorbridge.repository.PaymentRepository;
import com.example.findAnswer.mentorbridge.repository.SubscriptionRepository;
import com.example.findAnswer.mentorbridge.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
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

// 결제창 팝업 없이 등록된 카드로 서버가 직접 청구하는 구독 신청 흐름.
@ExtendWith(MockitoExtension.class)
@DisplayName("PaymentPrepareService - 구독 신청(등록된 카드로 즉시 청구)")
class PaymentPrepareServiceTest {

    @Mock
    UserRepository userRepository;
    @Mock
    PaymentRepository paymentRepository;
    @Mock
    SubscriptionRepository subscriptionRepository;
    @Mock
    MentorPlanRepository mentorPlanRepository;
    @Mock
    PaymentMethodRepository paymentMethodRepository;
    @Mock
    PortOneBillingClient portOneBillingClient;
    @Mock
    PaymentSyncService paymentSyncService;

    @InjectMocks
    PaymentPrepareService paymentPrepareService;

    private static final Long USER_ID = 1L;
    private static final Long MENTOR_ID = 2L;
    private static final Long PLAN_ID = 3L;

    private User user;
    private MentorPlan plan;

    @org.junit.jupiter.api.BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(paymentPrepareService, "storeId", "store-test-0000");
        ReflectionTestUtils.setField(paymentPrepareService, "channelKey", "channel-key-test-0000");
        ReflectionTestUtils.setField(paymentPrepareService, "paymentIdPrefix", "MB");

        user = mock(User.class);
        User mentor = mock(User.class);
        given(mentor.getId()).willReturn(MENTOR_ID);
        given(userRepository.findById(any())).willReturn(Optional.of(mentor));
        plan = MentorPlan.builder()
                .mentor(mentor)
                .planName("스탠다드")
                .description("설명")
                .price(9900)
                .billingCycle(1)
                .build();
        ReflectionTestUtils.setField(plan, "id", PLAN_ID);
    }

    @Test
    @DisplayName("대표 결제수단이 없으면 PAYMENT_METHOD_REQUIRED로 거절하고 구독은 만들지 않는다")
    void 결제수단_없음_거절() {
        given(userRepository.findById(USER_ID)).willReturn(Optional.of(user));
        given(mentorPlanRepository.findByIdAndIsActiveTrue(PLAN_ID)).willReturn(Optional.of(plan));
        given(paymentMethodRepository.findByUserAndIsDefaultTrueAndPaymentMethodStatus(user, PaymentMethodStatus.ACTIVE))
                .willReturn(Optional.empty());

        assertThatThrownBy(() -> paymentPrepareService.subscribe(USER_ID, MENTOR_ID, PLAN_ID))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.PAYMENT_METHOD_REQUIRED);

        verify(subscriptionRepository, never()).save(any());
        verify(portOneBillingClient, never()).payWithBillingKey(
                anyString(), anyString(), anyString(), anyString(), anyLong(), anyString(), any(), any(), any());
    }

    @Test
    @DisplayName("요금제가 해당 멘토 소유가 아니면 INVALID_REQUEST로 거절한다")
    void 요금제_소유자_불일치_거절() {
        given(userRepository.findById(USER_ID)).willReturn(Optional.of(user));
        given(mentorPlanRepository.findByIdAndIsActiveTrue(PLAN_ID)).willReturn(Optional.of(plan));

        Long otherMentorId = 999L;

        assertThatThrownBy(() -> paymentPrepareService.subscribe(USER_ID, otherMentorId, PLAN_ID))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INVALID_REQUEST);
    }

    @Test
    @DisplayName("정상 흐름 — 대표 카드를 구독에 연결하고 서버가 직접 청구한 뒤 검증 결과를 그대로 반환한다")
    void 정상_구독_즉시청구() {
        PaymentMethod paymentMethod = PaymentMethod.builder()
                .id(10L)
                .paymentMethodStatus(PaymentMethodStatus.ACTIVE)
                .billingKey("billing-key-abc")
                .cardBrand("신한")
                .last4("1234")
                .cardNickname("내 카드")
                .isDefault(true)
                .build();

        given(userRepository.findById(USER_ID)).willReturn(Optional.of(user));
        given(user.getName()).willReturn("홍길동");
        given(user.getPhoneNumber()).willReturn("01012345678");
        given(user.getEmail()).willReturn("hong@example.com");

        given(mentorPlanRepository.findByIdAndIsActiveTrue(PLAN_ID)).willReturn(Optional.of(plan));
        given(paymentMethodRepository.findByUserAndIsDefaultTrueAndPaymentMethodStatus(user, PaymentMethodStatus.ACTIVE))
                .willReturn(Optional.of(paymentMethod));

        // 첫 구독이라 기존 Subscription이 없는 경우 — orElseGet에서 save한 값을 그대로 돌려준다(JPA IDENTITY 채번 흉내).
        given(subscriptionRepository.findByUserIdAndMentor_Id(USER_ID, MENTOR_ID)).willReturn(Optional.empty());
        given(subscriptionRepository.save(any(Subscription.class)))
                .willAnswer(invocation -> invocation.getArgument(0));

        given(paymentRepository.findBySubscriptionIdOrderByCycleNoDesc(any())).willReturn(List.of());

        PaymentCompleteResponse expectedResponse = new PaymentCompleteResponse(
                "MB-1-dummy", 100L, PaymentStatus.PAID, SubscriptionStatus.ACTIVE, 9900L, null);
        given(paymentSyncService.complete(anyString(), org.mockito.ArgumentMatchers.eq(USER_ID)))
                .willReturn(expectedResponse);

        PaymentCompleteResponse response = paymentPrepareService.subscribe(USER_ID, MENTOR_ID, PLAN_ID);

        assertThat(response).isEqualTo(expectedResponse);

        // 대표 카드가 구독에 연결됐는지 — save로 넘긴 것과 최종적으로 반환받은 게 같은 객체라 여기서 확인 가능
        ArgumentCaptor<Subscription> subscriptionCaptor = ArgumentCaptor.forClass(Subscription.class);
        verify(subscriptionRepository).save(subscriptionCaptor.capture());
        assertThat(subscriptionCaptor.getValue().getPaymentMethod().getId()).isEqualTo(10L);

        // 결제창 없이 서버가 직접 청구했는지 — 등록된 카드 정보로 호출됐는지 확인
        ArgumentCaptor<String> paymentIdCaptor = ArgumentCaptor.forClass(String.class);
        verify(portOneBillingClient).payWithBillingKey(
                paymentIdCaptor.capture(),
                org.mockito.ArgumentMatchers.eq("billing-key-abc"),
                org.mockito.ArgumentMatchers.eq("channel-key-test-0000"),
                org.mockito.ArgumentMatchers.eq("스탠다드 구독"),
                org.mockito.ArgumentMatchers.eq(9900L),
                org.mockito.ArgumentMatchers.eq("KRW"),
                org.mockito.ArgumentMatchers.eq("홍길동"),
                org.mockito.ArgumentMatchers.eq("01012345678"),
                org.mockito.ArgumentMatchers.eq("hong@example.com")
        );
        assertThat(paymentIdCaptor.getValue()).startsWith("MB-1-");

        // complete()도 같은 paymentId로 재조회 검증을 거쳤는지
        verify(paymentSyncService).complete(paymentIdCaptor.getValue(), USER_ID);
    }
}
