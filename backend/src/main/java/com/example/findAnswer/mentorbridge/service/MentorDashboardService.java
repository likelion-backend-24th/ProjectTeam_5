package com.example.findAnswer.mentorbridge.service;

import com.example.findAnswer.mentorbridge.constants.ErrorCode;
import com.example.findAnswer.mentorbridge.constants.PaymentCancellationStatus;
import com.example.findAnswer.mentorbridge.constants.PaymentStatus;
import com.example.findAnswer.mentorbridge.constants.Role;
import com.example.findAnswer.mentorbridge.constants.SubscriptionStatus;
import com.example.findAnswer.mentorbridge.dto.mentor.MentorDashboardSummaryResponse;
import com.example.findAnswer.mentorbridge.dto.mentor.MentorPaymentResponse;
import com.example.findAnswer.mentorbridge.dto.mentor.MentorProfileCompletenessResponse;
import com.example.findAnswer.mentorbridge.dto.mentor.MentorRatingHistogramResponse;
import com.example.findAnswer.mentorbridge.dto.mentor.MentorRecentPostResponse;
import com.example.findAnswer.mentorbridge.dto.mentor.MentorReviewResponse;
import com.example.findAnswer.mentorbridge.dto.mentor.MentorSubscriberResponse;
import com.example.findAnswer.mentorbridge.dto.mentor.MentorTrendPointResponse;
import com.example.findAnswer.mentorbridge.dto.payment.PaymentCancellationResponse;
import com.example.findAnswer.mentorbridge.entity.MentorProfile;
import com.example.findAnswer.mentorbridge.entity.User;
import com.example.findAnswer.mentorbridge.exception.CustomException;
import com.example.findAnswer.mentorbridge.repository.MentorPostRepository;
import com.example.findAnswer.mentorbridge.repository.MentorReviewRepository;
import com.example.findAnswer.mentorbridge.repository.PaymentCancellationRepository;
import com.example.findAnswer.mentorbridge.repository.PaymentRepository;
import com.example.findAnswer.mentorbridge.repository.SubscriptionRepository;
import com.example.findAnswer.mentorbridge.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

// 멘토 대시보드(docs/mentor-dashboard-plan.md 2단계) — 항상 "내(로그인한 멘토)" 기준으로 조회한다.
// 매출 집계 기준은 캘린더 월(이번 달 1일 00:00 ~ 지금)로 정했다 — 요금제마다 결제 주기(1/3/12개월)가
// 달라서 "구독 시작일 기준 N일"로 하면 멘토별로 기준이 다 달라지고 복잡해진다.
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MentorDashboardService {

    private static final List<SubscriptionStatus> ACTIVE_STATUSES =
            List.of(SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCEL_RESERVED);
    private static final int TREND_MONTHS = 7;
    private static final int PROFILE_FIELD_COUNT = 7; // bio, company, career, tags, education, schedule, profileImageUrl

    private final UserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentCancellationRepository paymentCancellationRepository;
    private final MentorPostRepository mentorPostRepository;
    private final MentorReviewRepository mentorReviewRepository;

    public MentorDashboardSummaryResponse getSummary(Long mentorId) {
        validateMentor(mentorId);
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime monthStart = now.toLocalDate().withDayOfMonth(1).atStartOfDay();
        LocalDateTime lastMonthStart = monthStart.minusMonths(1);

        long subscriberCount = subscriptionRepository.countByMentor_IdAndStatusInAndCurrentPeriodEndAfter(
                mentorId, ACTIVE_STATUSES, now
        );
        long cumulativeNow = subscriptionRepository.countByMentor_Id(mentorId);
        long cumulativeBeforeThisMonth = subscriptionRepository.countByMentor_IdAndCreatedAtBefore(mentorId, monthStart);
        double subscriberGrowthRate = growthRate(cumulativeNow, cumulativeBeforeThisMonth);

        long monthlyRevenue = paymentRepository.sumPaidAmountByMentorSince(mentorId, PaymentStatus.PAID, monthStart);
        long lastMonthRevenue = paymentRepository.sumPaidAmountByMentorBetween(
                mentorId, PaymentStatus.PAID, lastMonthStart, monthStart
        );
        double revenueGrowthRate = growthRate(monthlyRevenue, lastMonthRevenue);

        long pendingRefundCount = paymentCancellationRepository.countByPayment_Subscription_Mentor_IdAndStatus(
                mentorId, PaymentCancellationStatus.REQUESTED
        );

        long postCount = mentorPostRepository.countByMentor_Id(mentorId);
        long newPostCountThisMonth = mentorPostRepository.countByMentor_IdAndCreatedAtAfter(mentorId, monthStart);

        double averageRating = mentorReviewRepository.findAverageRatingByMentorId(mentorId);
        long reviewCount = mentorReviewRepository.countByMentor_Id(mentorId);

        return new MentorDashboardSummaryResponse(
                (int) subscriberCount,
                subscriberGrowthRate,
                monthlyRevenue,
                revenueGrowthRate,
                (int) pendingRefundCount,
                (int) postCount,
                (int) newPostCountThisMonth,
                averageRating,
                (int) reviewCount
        );
    }

    // 최근 N개월의 누적 구독 건수 / 월별 매출 추이
    public List<MentorTrendPointResponse> getTrend(Long mentorId) {
        validateMentor(mentorId);
        LocalDateTime thisMonthStart = LocalDateTime.now().toLocalDate().withDayOfMonth(1).atStartOfDay();
        DateTimeFormatter monthKeyFormat = DateTimeFormatter.ofPattern("yyyy-MM");

        List<MentorTrendPointResponse> points = new ArrayList<>();
        for (int i = TREND_MONTHS - 1; i >= 0; i--) {
            LocalDateTime monthStart = thisMonthStart.minusMonths(i);
            LocalDateTime monthEnd = monthStart.plusMonths(1);

            long subscriberCount = subscriptionRepository.countByMentor_IdAndCreatedAtBefore(mentorId, monthEnd);
            long revenue = paymentRepository.sumPaidAmountByMentorBetween(mentorId, PaymentStatus.PAID, monthStart, monthEnd);

            points.add(new MentorTrendPointResponse(
                    monthStart.format(monthKeyFormat),
                    monthStart.getMonthValue() + "월",
                    subscriberCount,
                    revenue
            ));
        }
        return points;
    }

    public MentorRatingHistogramResponse getRatingHistogram(Long mentorId) {
        validateMentor(mentorId);
        double average = mentorReviewRepository.findAverageRatingByMentorId(mentorId);
        long reviewCount = mentorReviewRepository.countByMentor_Id(mentorId);

        Map<Integer, Long> counts = new HashMap<>();
        for (Object[] row : mentorReviewRepository.countGroupedByRating(mentorId)) {
            counts.put((Integer) row[0], (Long) row[1]);
        }

        return new MentorRatingHistogramResponse(
                average,
                reviewCount,
                counts.getOrDefault(5, 0L),
                counts.getOrDefault(4, 0L),
                counts.getOrDefault(3, 0L),
                counts.getOrDefault(2, 0L),
                counts.getOrDefault(1, 0L)
        );
    }

    public MentorProfileCompletenessResponse getProfileCompleteness(Long mentorId) {
        User mentor = validateMentor(mentorId);
        MentorProfile profile = mentor.getMentorProfile();

        int filled = 0;
        if (profile != null) {
            if (isFilled(profile.getBio())) filled++;
            if (isFilled(profile.getCompany())) filled++;
            if (isFilled(profile.getCareer())) filled++;
            if (isFilled(profile.getTags())) filled++;
            if (isFilled(profile.getEducation())) filled++;
            if (isFilled(profile.getSchedule())) filled++;
        }
        if (isFilled(mentor.getProfileImageUrl())) filled++;

        int percentage = (int) Math.round(filled * 100.0 / PROFILE_FIELD_COUNT);
        return new MentorProfileCompletenessResponse(percentage);
    }

    public List<MentorRecentPostResponse> getRecentPosts(Long mentorId) {
        validateMentor(mentorId);
        return mentorPostRepository.findByMentor_IdOrderByCreatedAtDesc(mentorId)
                .stream()
                .limit(5)
                .map(MentorRecentPostResponse::from)
                .toList();
    }

    public List<MentorReviewResponse> getRecentReviews(Long mentorId) {
        validateMentor(mentorId);
        return mentorReviewRepository.findByMentor_IdOrderByCreatedAtDesc(mentorId)
                .stream()
                .limit(5)
                .map(MentorReviewResponse::from)
                .toList();
    }

    public List<MentorSubscriberResponse> getSubscribers(Long mentorId) {
        validateMentor(mentorId);
        return subscriptionRepository.findByMentor_IdOrderByCreatedAtDesc(mentorId)
                .stream()
                .map(MentorSubscriberResponse::from)
                .toList();
    }

    public List<PaymentCancellationResponse> getPendingRefunds(Long mentorId) {
        validateMentor(mentorId);
        return paymentCancellationRepository
                .findByPayment_Subscription_Mentor_IdAndStatusOrderByCreatedAtAsc(mentorId, PaymentCancellationStatus.REQUESTED)
                .stream()
                .map(PaymentCancellationResponse::from)
                .toList();
    }

    public List<MentorPaymentResponse> getPayments(Long mentorId) {
        validateMentor(mentorId);
        return paymentRepository.findBySubscription_Mentor_IdOrderByCreatedAtDesc(mentorId)
                .stream()
                .map(MentorPaymentResponse::from)
                .toList();
    }

    private double growthRate(long current, long base) {
        if (base <= 0) {
            return current > 0 ? 100.0 : 0.0;
        }
        return ((double) (current - base) / base) * 100.0;
    }

    private boolean isFilled(String value) {
        return value != null && !value.isBlank();
    }

    private User validateMentor(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        if (user.getRole() != Role.MENTOR) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }
        return user;
    }
}
