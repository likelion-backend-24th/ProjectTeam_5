package com.example.findAnswer.mentorbridge.service;

import com.example.findAnswer.mentorbridge.constants.ErrorCode;
import com.example.findAnswer.mentorbridge.constants.PaymentCancellationStatus;
import com.example.findAnswer.mentorbridge.constants.PaymentStatus;
import com.example.findAnswer.mentorbridge.constants.SubscriptionStatus;
import com.example.findAnswer.mentorbridge.dto.payment.PaymentCancellationResponse;
import com.example.findAnswer.mentorbridge.entity.Payment;
import com.example.findAnswer.mentorbridge.entity.PaymentCancellation;
import com.example.findAnswer.mentorbridge.entity.Subscription;
import com.example.findAnswer.mentorbridge.entity.User;
import com.example.findAnswer.mentorbridge.exception.CustomException;
import com.example.findAnswer.mentorbridge.repository.PaymentCancellationRepository;
import com.example.findAnswer.mentorbridge.repository.PaymentRepository;
import com.example.findAnswer.mentorbridge.repository.SubscriptionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

// 환불 요청 → 관리자 승인/거절. 해지(다음 결제 중단)와는 별개 기능이다.
@ExtendWith(MockitoExtension.class)
@DisplayName("PaymentCancellationService - 환불 요청/승인/거절")
class PaymentCancellationServiceTest {

    @Mock
    PaymentRepository paymentRepository;
    @Mock
    SubscriptionRepository subscriptionRepository;
    @Mock
    PaymentCancellationRepository paymentCancellationRepository;
    @Mock
    PaymentSyncService paymentSyncService;

    @InjectMocks
    PaymentCancellationService paymentCancellationService;

    private static final Long USER_ID = 1L;
    private static final Long SUBSCRIPTION_ID = 50L;
    private static final String PAYMENT_ID = "MB-1-abc";

    private Payment paidPayment;
    private Subscription subscription;

    @BeforeEach
    void setUp() {
        User user = new User("user@test.com", "pw", "유저", null);
        ReflectionTestUtils.setField(user, "id", USER_ID);
        User mentor = new User("mentor@test.com", "pw", "멘토", null);
        ReflectionTestUtils.setField(mentor, "id", 2L);

        subscription = Subscription.builder()
                .user(user)
                .mentor(mentor)
                .status(SubscriptionStatus.ACTIVE)
                .amount(9900)
                .currentPeriodStart(LocalDateTime.now())
                .currentPeriodEnd(LocalDateTime.now().plusDays(20))
                .build();
        ReflectionTestUtils.setField(subscription, "id", SUBSCRIPTION_ID);

        paidPayment = Payment.builder()
                .id(100L)
                .paymentId(PAYMENT_ID)
                .subscription(subscription)
                .cycleNo(1)
                .attemptNo(1)
                .currency("KRW")
                .amount(9900L)
                .status(PaymentStatus.PAID)
                .build();
    }

    @Nested
    @DisplayName("환불 요청")
    class RequestCancellation {

        @Test
        @DisplayName("본인이 결제한 PAID 건이면 REQUESTED 상태로 저장한다")
        void 정상_요청() {
            given(paymentRepository.findByPaymentId(PAYMENT_ID)).willReturn(Optional.of(paidPayment));
            given(subscriptionRepository.findById(SUBSCRIPTION_ID)).willReturn(Optional.of(subscription));
            given(paymentCancellationRepository.existsByPaymentIdAndStatus(100L, PaymentCancellationStatus.REQUESTED))
                    .willReturn(false);
            given(paymentCancellationRepository.save(any(PaymentCancellation.class)))
                    .willAnswer(invocation -> invocation.getArgument(0));

            PaymentCancellationResponse response =
                    paymentCancellationService.requestCancellation(USER_ID, PAYMENT_ID, "단순 변심");

            assertThat(response.status()).isEqualTo(PaymentCancellationStatus.REQUESTED);
            assertThat(response.amount()).isEqualTo(9900L);
            assertThat(response.paymentId()).isEqualTo(PAYMENT_ID);

            ArgumentCaptor<PaymentCancellation> captor = ArgumentCaptor.forClass(PaymentCancellation.class);
            verify(paymentCancellationRepository).save(captor.capture());
            assertThat(captor.getValue().getRequestedByUserId()).isEqualTo(USER_ID);
            assertThat(captor.getValue().getReason()).isEqualTo("단순 변심");
        }

        @Test
        @DisplayName("본인 결제가 아니면 ACCESS_DENIED")
        void 타인_결제_거절() {
            given(paymentRepository.findByPaymentId(PAYMENT_ID)).willReturn(Optional.of(paidPayment));
            given(subscriptionRepository.findById(SUBSCRIPTION_ID)).willReturn(Optional.of(subscription));

            Long otherUserId = 999L;

            assertThatThrownBy(() -> paymentCancellationService.requestCancellation(otherUserId, PAYMENT_ID, "사유"))
                    .isInstanceOf(CustomException.class)
                    .extracting("errorCode")
                    .isEqualTo(ErrorCode.ACCESS_DENIED);

            verify(paymentCancellationRepository, never()).save(any());
        }

        @Test
        @DisplayName("결제 상태가 PAID가 아니면 PAYMENT_NOT_CANCELLABLE")
        void 미결제_거절() {
            paidPayment = Payment.builder()
                    .id(100L)
                    .paymentId(PAYMENT_ID)
                    .subscription(subscription)
                    .cycleNo(1)
                    .attemptNo(1)
                    .currency("KRW")
                    .amount(9900L)
                    .status(PaymentStatus.READY)
                    .build();
            given(paymentRepository.findByPaymentId(PAYMENT_ID)).willReturn(Optional.of(paidPayment));
            given(subscriptionRepository.findById(SUBSCRIPTION_ID)).willReturn(Optional.of(subscription));

            assertThatThrownBy(() -> paymentCancellationService.requestCancellation(USER_ID, PAYMENT_ID, "사유"))
                    .isInstanceOf(CustomException.class)
                    .extracting("errorCode")
                    .isEqualTo(ErrorCode.PAYMENT_NOT_CANCELLABLE);
        }

        @Test
        @DisplayName("이미 요청이 대기 중이면 CANCELLATION_ALREADY_PROCESSED")
        void 중복요청_거절() {
            given(paymentRepository.findByPaymentId(PAYMENT_ID)).willReturn(Optional.of(paidPayment));
            given(subscriptionRepository.findById(SUBSCRIPTION_ID)).willReturn(Optional.of(subscription));
            given(paymentCancellationRepository.existsByPaymentIdAndStatus(100L, PaymentCancellationStatus.REQUESTED))
                    .willReturn(true);

            assertThatThrownBy(() -> paymentCancellationService.requestCancellation(USER_ID, PAYMENT_ID, "사유"))
                    .isInstanceOf(CustomException.class)
                    .extracting("errorCode")
                    .isEqualTo(ErrorCode.CANCELLATION_ALREADY_PROCESSED);

            verify(paymentCancellationRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("관리자 승인/거절")
    class ApproveOrReject {

        private PaymentCancellation requestedCancellation() {
            return PaymentCancellation.builder()
                    .payment(paidPayment)
                    .requestedByUserId(USER_ID)
                    .amount(9900L)
                    .status(PaymentCancellationStatus.REQUESTED)
                    .reason("단순 변심")
                    .build();
        }

        @Test
        @DisplayName("가장 최근 회차(=지금 이용 중인 기간)를 환불하면 즉시 접근을 끊는다(EXPIRED)")
        void 승인_성공_최신회차_즉시만료() {
            PaymentCancellation cancellation = requestedCancellation();
            given(paymentCancellationRepository.findById(1L)).willReturn(Optional.of(cancellation));
            given(subscriptionRepository.findById(SUBSCRIPTION_ID)).willReturn(Optional.of(subscription));
            given(paymentRepository.findFirstBySubscriptionIdAndStatusOrderByCycleNoDesc(SUBSCRIPTION_ID, PaymentStatus.READY))
                    .willReturn(Optional.empty());
            given(paymentRepository.findBySubscriptionIdOrderByCycleNoDesc(SUBSCRIPTION_ID))
                    .willReturn(java.util.List.of(paidPayment)); // 더 최근에 결제된 회차 없음

            paymentCancellationService.approve(1L);

            verify(paymentSyncService).cancelPayment(paidPayment, "단순 변심");
            assertThat(cancellation.getStatus()).isEqualTo(PaymentCancellationStatus.SUCCEEDED);
            assertThat(subscription.getStatus()).isEqualTo(SubscriptionStatus.EXPIRED);
            assertThat(subscription.getCurrentPeriodEnd()).isBeforeOrEqualTo(LocalDateTime.now());
        }

        @Test
        @DisplayName("과거 회차를 뒤늦게 환불해도 더 최근 회차가 살아있으면 기간 끝까지는 이용을 유지한다(CANCEL_RESERVED)")
        void 승인_성공_과거회차_해지예약() {
            PaymentCancellation cancellation = requestedCancellation(); // paidPayment(cycleNo=1)에 대한 환불
            Payment newerPayment = Payment.builder()
                    .id(101L)
                    .paymentId("MB-2-def")
                    .subscription(subscription)
                    .cycleNo(2)
                    .attemptNo(1)
                    .currency("KRW")
                    .amount(9900L)
                    .status(PaymentStatus.PAID)
                    .build();

            given(paymentCancellationRepository.findById(1L)).willReturn(Optional.of(cancellation));
            given(subscriptionRepository.findById(SUBSCRIPTION_ID)).willReturn(Optional.of(subscription));
            given(paymentRepository.findFirstBySubscriptionIdAndStatusOrderByCycleNoDesc(SUBSCRIPTION_ID, PaymentStatus.READY))
                    .willReturn(Optional.empty());
            given(paymentRepository.findBySubscriptionIdOrderByCycleNoDesc(SUBSCRIPTION_ID))
                    .willReturn(java.util.List.of(newerPayment, paidPayment)); // 2회차가 더 최근에 결제 완료됨

            paymentCancellationService.approve(1L);

            assertThat(subscription.getStatus()).isEqualTo(SubscriptionStatus.CANCEL_RESERVED);
        }

        @Test
        @DisplayName("PortOne 취소 API가 실패하면 실패 기록을 별도 트랜잭션으로 남기고 예외를 그대로 전파한다")
        void 승인_실패_PortOne오류() {
            PaymentCancellation cancellation = requestedCancellation();
            given(paymentCancellationRepository.findById(1L)).willReturn(Optional.of(cancellation));
            doThrow(new CustomException(ErrorCode.PAYMENT_CANCEL_FAILED))
                    .when(paymentSyncService).cancelPayment(paidPayment, "단순 변심");

            assertThatThrownBy(() -> paymentCancellationService.approve(1L))
                    .isInstanceOf(CustomException.class)
                    .extracting("errorCode")
                    .isEqualTo(ErrorCode.PAYMENT_CANCEL_FAILED);

            // approve() 자체는 @Transactional이라 이 안에서 cancellation.markFailed()를 직접 호출하면
            // 예외 전파와 함께 롤백돼 실패 기록이 안 남는다 — REQUIRES_NEW로 별도 커밋하는
            // paymentSyncService.recordCancellationFailure()에 위임했는지만 검증한다(실제 markFailed() 반영은
            // 그 메서드 자체가 목이라 여기서 검증 못 함 — REQUIRES_NEW 동작은 통합 테스트 영역).
            verify(paymentSyncService).recordCancellationFailure(eq(1L), any(String.class));
            verify(subscriptionRepository, never()).findById(any());
        }

        @Test
        @DisplayName("이미 처리된 요청은 다시 승인할 수 없다")
        void 이미처리된_요청_재승인_거절() {
            PaymentCancellation cancellation = requestedCancellation();
            cancellation.approve(null); // 이미 SUCCEEDED
            given(paymentCancellationRepository.findById(1L)).willReturn(Optional.of(cancellation));

            assertThatThrownBy(() -> paymentCancellationService.approve(1L))
                    .isInstanceOf(CustomException.class)
                    .extracting("errorCode")
                    .isEqualTo(ErrorCode.CANCELLATION_ALREADY_PROCESSED);

            verify(paymentSyncService, never()).cancelPayment(any(), any());
        }

        @Test
        @DisplayName("거절하면 REJECTED 상태와 관리자 메모가 남는다")
        void 거절() {
            PaymentCancellation cancellation = requestedCancellation();
            given(paymentCancellationRepository.findById(1L)).willReturn(Optional.of(cancellation));

            paymentCancellationService.reject(1L, "재구매 유도 완료");

            assertThat(cancellation.getStatus()).isEqualTo(PaymentCancellationStatus.REJECTED);
            assertThat(cancellation.getAdminNote()).isEqualTo("재구매 유도 완료");
            verify(paymentSyncService, never()).cancelPayment(any(), any());
        }
    }
}
