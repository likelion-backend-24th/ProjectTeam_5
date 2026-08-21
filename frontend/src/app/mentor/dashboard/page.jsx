"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/contexts/AuthContext";
import {
  getMentorDashboardSummary,
  getMentorDashboardTrend,
  getMentorRatingHistogram,
  getMentorProfileCompleteness,
  getMentorRecentPosts,
  getMentorRecentReviews,
  getMentorSubscribers,
  getMentorPayments,
  getMentorPendingRefunds,
} from "@/lib/mentorDashboard";
import { getMyChatRooms } from "@/lib/chat";
import MentorPlanSection from "@/app/profile/MentorPlanSection";
import styles from "./page.module.css";

const STATUS_LABEL = {
  ACTIVE: "구독중",
  CANCEL_RESERVED: "해지 예약됨",
  PENDING: "결제 대기",
  PAST_DUE: "결제 실패",
  EXPIRED: "만료됨",
};

const PAYMENT_STATUS_LABEL = {
  READY: "결제 대기",
  PENDING: "결제 진행중",
  PAID: "결제 완료",
  FAILED: "결제 실패",
  CANCELED: "취소됨",
  PARTIALLY_CANCELED: "부분 취소됨",
};

const NEW_WINDOW_DAYS = 7;

function isRecent(dateString) {
  if (!dateString) return false;
  const diffMs = Date.now() - new Date(dateString).getTime();
  return diffMs >= 0 && diffMs <= NEW_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

function DeltaChip({ value }) {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  const rounded = Math.round(value * 10) / 10;
  const isFlat = rounded === 0;
  const isUp = rounded > 0;
  return (
    <span className={isFlat ? styles.deltaFlat : isUp ? styles.deltaUp : styles.deltaDown}>
      {isFlat ? "-" : isUp ? "▲" : "▼"} {Math.abs(rounded)}% 전월 대비
    </span>
  );
}

function TrendChart({ trend }) {
  if (!trend || trend.length === 0) {
    return <p className={styles.muted}>아직 데이터가 없습니다.</p>;
  }

  const width = 640;
  const height = 220;
  const paddingX = 36;
  const paddingY = 24;
  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingY * 2;

  const maxSubscribers = Math.max(...trend.map((t) => t.subscriberCount), 1);
  const maxRevenue = Math.max(...trend.map((t) => t.revenue), 1);
  const step = trend.length > 1 ? innerWidth / (trend.length - 1) : 0;
  const barWidth = Math.min(28, innerWidth / trend.length / 2);

  const linePoints = trend
    .map((t, i) => {
      const x = paddingX + step * i;
      const y = paddingY + innerHeight - (t.revenue / maxRevenue) * innerHeight;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className={styles.chartWrap}>
      <svg viewBox={`0 0 ${width} ${height}`} className={styles.chartSvg} role="img" aria-label="구독 및 수익 추이">
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
          <line
            key={ratio}
            x1={paddingX}
            x2={width - paddingX}
            y1={paddingY + innerHeight * ratio}
            y2={paddingY + innerHeight * ratio}
            className={styles.chartGridLine}
          />
        ))}

        {trend.map((t, i) => {
          const x = paddingX + step * i - barWidth / 2;
          const barHeight = (t.subscriberCount / maxSubscribers) * innerHeight;
          const y = paddingY + innerHeight - barHeight;
          return (
            <g key={t.month}>
              <rect x={x} y={y} width={barWidth} height={Math.max(barHeight, 1)} className={styles.chartBar} rx="3" />
              <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" className={styles.chartBarLabel}>
                {t.subscriberCount}
              </text>
              <text x={paddingX + step * i} y={height - 4} textAnchor="middle" className={styles.chartAxisLabel}>
                {t.label}
              </text>
            </g>
          );
        })}

        <polyline points={linePoints} className={styles.chartLine} />
        {trend.map((t, i) => {
          const x = paddingX + step * i;
          const y = paddingY + innerHeight - (t.revenue / maxRevenue) * innerHeight;
          return (
            <g key={`dot-${t.month}`}>
              <circle cx={x} cy={y} r="4" className={styles.chartDot} />
              <text x={x} y={y - 10} textAnchor="middle" className={styles.chartRevenueLabel}>
                {(t.revenue / 10000).toLocaleString()}만
              </text>
            </g>
          );
        })}
      </svg>
      <div className={styles.chartLegend}>
        <span className={styles.legendItem}>
          <span className={styles.legendDotBar} /> 누적 구독자 수(명)
        </span>
        <span className={styles.legendItem}>
          <span className={styles.legendDotLine} /> 월 매출(원)
        </span>
      </div>
    </div>
  );
}

function ProfileCompletenessRing({ percentage }) {
  const pct = Math.max(0, Math.min(100, percentage ?? 0));
  return (
    <div className={styles.completenessRow}>
      <div className={styles.completenessRing} style={{ "--pct": pct }}>
        <span className={styles.completenessValue}>{pct}%</span>
      </div>
      <p className={styles.mutedSmall}>
        매력적인 프로필로 더 많은 구독자를 만나보세요.
        {pct < 100 && (
          <>
            {" "}
            <Link href="/profile">프로필 채우러 가기 →</Link>
          </>
        )}
      </p>
    </div>
  );
}

function RatingHistogram({ histogram }) {
  if (!histogram) return null;
  const rows = [
    { star: 5, count: histogram.count5 },
    { star: 4, count: histogram.count4 },
    { star: 3, count: histogram.count3 },
    { star: 2, count: histogram.count2 },
    { star: 1, count: histogram.count1 },
  ];
  const total = histogram.reviewCount || 0;

  return (
    <div>
      <div className={styles.ratingHeadline}>
        <strong>{Number(histogram.average || 0).toFixed(1)}</strong>
        <span className={styles.mutedSmall}>/ 5.0 · 리뷰 {total}개</span>
      </div>
      <div className={styles.histogram}>
        {rows.map((row) => {
          const width = total > 0 ? (row.count / total) * 100 : 0;
          return (
            <div key={row.star} className={styles.histogramRow}>
              <span className={styles.histogramStarLabel}>{row.star}점</span>
              <div className={styles.histogramTrack}>
                <div className={styles.histogramFill} style={{ width: `${width}%` }} />
              </div>
              <span className={styles.histogramCount}>{row.count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function MentorDashboardPage() {
  const router = useRouter();
  const { user, isLoggedIn, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [ratingHistogram, setRatingHistogram] = useState(null);
  const [completeness, setCompleteness] = useState(null);
  const [recentPosts, setRecentPosts] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [chatRooms, setChatRooms] = useState([]);

  useEffect(() => {
    if (authLoading) return;

    if (!isLoggedIn || user?.role !== "MENTOR") {
      alert("멘토만 이용할 수 있는 페이지입니다.");
      router.push("/profile");
      return;
    }

    let ignore = false;

    (async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const [
          summaryData,
          trendData,
          ratingData,
          completenessData,
          recentPostsData,
          recentReviewsData,
          subscribersData,
          paymentsData,
          refundsData,
          roomsData,
        ] = await Promise.all([
          getMentorDashboardSummary(),
          getMentorDashboardTrend(),
          getMentorRatingHistogram(),
          getMentorProfileCompleteness(),
          getMentorRecentPosts(),
          getMentorRecentReviews(),
          getMentorSubscribers(),
          getMentorPayments(),
          getMentorPendingRefunds(),
          getMyChatRooms().catch(() => []),
        ]);
        if (ignore) return;
        setSummary(summaryData);
        setTrend(Array.isArray(trendData) ? trendData : []);
        setRatingHistogram(ratingData);
        setCompleteness(completenessData);
        setRecentPosts(Array.isArray(recentPostsData) ? recentPostsData : []);
        setRecentReviews(Array.isArray(recentReviewsData) ? recentReviewsData : []);
        setSubscribers(Array.isArray(subscribersData) ? subscribersData : []);
        setPayments(Array.isArray(paymentsData) ? paymentsData : []);
        setRefunds(Array.isArray(refundsData) ? refundsData : []);
        setChatRooms(Array.isArray(roomsData) ? roomsData : []);
      } catch (err) {
        if (!ignore) setErrorMessage(err.message || "대시보드 정보를 불러오지 못했습니다.");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [isLoggedIn, user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <main className={styles.page}>
        <p className={styles.statusText}>불러오는 중...</p>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className={styles.page}>
        <p className={styles.errorMessage}>{errorMessage}</p>
      </main>
    );
  }

  const recentSubscribers = subscribers.slice(0, 5);

  return (
    <main className={styles.page}>
      <div className={styles.heading}>
        <h1>멘토 대시보드</h1>
        <p>{user?.name}님, 구독자와 매출 현황을 한눈에 확인하세요. (이번 달 기준)</p>
      </div>

      {/* 요약 카드 */}
      <section className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>총 구독자</span>
          <strong className={styles.summaryValue}>{summary?.subscriberCount ?? 0}명</strong>
          <DeltaChip value={summary?.subscriberGrowthRate} />
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>이번 달 수익</span>
          <strong className={styles.summaryValue}>{Number(summary?.monthlyRevenue || 0).toLocaleString()}원</strong>
          <DeltaChip value={summary?.revenueGrowthRate} />
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>전체 게시글</span>
          <strong className={styles.summaryValue}>{summary?.postCount ?? 0}개</strong>
          <span className={styles.deltaFlat}>이번 달 {summary?.newPostCountThisMonth ?? 0}개 작성</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>평균 평점</span>
          <strong className={styles.summaryValue}>{Number(summary?.averageRating || 0).toFixed(1)}</strong>
          <span className={styles.deltaFlat}>리뷰 {summary?.reviewCount ?? 0}개</span>
        </div>
      </section>

      {/* 구독 및 수익 추이 */}
      <section className={styles.card} style={{ marginBottom: 24 }}>
        <h2 className={styles.cardTitle}>구독 및 수익 추이 (최근 7개월)</h2>
        <TrendChart trend={trend} />
      </section>

      <div className={styles.grid}>
        <div className={styles.col}>
          {/* 최근 게시글 */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>최근 게시글</h2>
            {recentPosts.length === 0 ? (
              <p className={styles.muted}>작성한 게시글이 없습니다.</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>제목</th>
                    <th>공개 범위</th>
                    <th>작성일</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPosts.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <Link href={`/mentors/${user?.id}/posts/${p.id}`} className={styles.postTitleLink}>
                          {p.title}
                        </Link>
                      </td>
                      <td>{p.isPublic ? "전체 공개" : "구독자 전용"}</td>
                      <td>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* 구독자 목록 */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>구독자 ({subscribers.length})</h2>
            {subscribers.length === 0 ? (
              <p className={styles.muted}>아직 구독자가 없습니다.</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>이름</th>
                    <th>요금제</th>
                    <th>상태</th>
                    <th>가입일</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((s) => (
                    <tr key={s.subscriptionId}>
                      <td>
                        {s.userName}
                        {isRecent(s.createdAt) && <span className={styles.newBadge}>NEW</span>}
                      </td>
                      <td>{s.planName || "-"}</td>
                      <td>{STATUS_LABEL[s.status] || s.status}</td>
                      <td>{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* 결제 내역 */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>결제 내역</h2>
            {payments.length === 0 ? (
              <p className={styles.muted}>결제 내역이 없습니다.</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>구독자</th>
                    <th>회차</th>
                    <th>금액</th>
                    <th>상태</th>
                    <th>결제일</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.paymentId}>
                      <td>{p.userName}</td>
                      <td>{p.cycleNo}</td>
                      <td>{Number(p.amount || 0).toLocaleString()}원</td>
                      <td>{PAYMENT_STATUS_LABEL[p.status] || p.status}</td>
                      <td>{p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>

        <div className={styles.col}>
          {/* 프로필 완성도 */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>프로필 완성도</h2>
            <ProfileCompletenessRing percentage={completeness?.percentage} />
          </section>

          {/* 빠른 작업 */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>빠른 작업</h2>
            <Link href={`/mentors/${user?.id}`} className={styles.linkRow}>
              새 게시글 작성 / 게시글 관리 →
            </Link>
            <Link href="#plan-section" className={styles.linkRow}>
              구독 혜택(요금제) 수정 →
            </Link>
            <Link href="/profile" className={styles.linkRow}>
              프로필 편집 →
            </Link>
            <Link href="/chat" className={styles.linkRow}>
              채팅방{chatRooms.length > 0 ? ` (${chatRooms.length})` : ""} →
            </Link>
          </section>

          {/* 리뷰 요약 */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>리뷰 요약</h2>
            <RatingHistogram histogram={ratingHistogram} />
          </section>

          {/* 최근 리뷰 */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>최근 리뷰</h2>
            {recentReviews.length === 0 ? (
              <p className={styles.muted}>아직 등록된 리뷰가 없습니다.</p>
            ) : (
              <div className={styles.reviewList}>
                {recentReviews.map((r) => (
                  <div key={r.id} className={styles.reviewRow}>
                    <div className={styles.reviewHead}>
                      <span>{r.userName}</span>
                      <span className={styles.reviewStars}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                    </div>
                    {r.comment && <p className={styles.reviewComment}>{r.comment}</p>}
                    <span className={styles.mutedSmall}>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 대기 중인 환불 요청 */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>대기 중인 환불 요청 ({refunds.length})</h2>
            {refunds.length === 0 ? (
              <p className={styles.muted}>대기 중인 환불 요청이 없습니다.</p>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {refunds.map((r) => (
                  <div key={r.id} className={styles.refundRow}>
                    <div>{r.userName} · {Number(r.amount || 0).toLocaleString()}원</div>
                    <div className={styles.mutedSmall}>{r.reason || "-"}</div>
                  </div>
                ))}
              </div>
            )}
            <p className={styles.mutedSmall} style={{ marginTop: 8 }}>
              환불 승인/거절은 관리자만 처리할 수 있습니다.
            </p>
          </section>

          {/* 요금제 관리 (기존 프로필 페이지 컴포넌트 재사용) */}
          <div id="plan-section">
            <MentorPlanSection />
          </div>
        </div>
      </div>
    </main>
  );
}
