"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getMySubscriptions,
  unsubscribeMentor,
  getPaymentHistory,
  requestRefund,
  getMyCancellations,
} from "@/lib/subscriptions";

const STATUS_LABEL = {
  ACTIVE: { text: "구독중", color: "#16a34a" },
  CANCEL_RESERVED: { text: "해지 예약됨", color: "#f97316" },
  PENDING: { text: "결제 대기", color: "#6b7280" },
  PAST_DUE: { text: "결제 실패", color: "#ef4444" },
  EXPIRED: { text: "만료됨", color: "#6b7280" },
};

const PAYMENT_STATUS_LABEL = {
  READY: "결제 대기",
  PENDING: "결제 진행중",
  PAID: "결제 완료",
  FAILED: "결제 실패",
  CANCELED: "취소됨",
  PARTIALLY_CANCELED: "부분 취소됨",
};

const CANCELLATION_STATUS_LABEL = {
  REQUESTED: { text: "처리 대기중", color: "#f97316" },
  SUCCEEDED: { text: "환불 완료", color: "#16a34a" },
  REJECTED: { text: "거절됨", color: "#ef4444" },
  FAILED: { text: "처리 실패", color: "#ef4444" },
};

export default function SubscriptionManagePage() {
  const router = useRouter();

  const [subscriptions, setSubscriptions] = useState([]);
  const [cancellations, setCancellations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const loadSubscriptions = async () => {
    try {
      const [subs, myCancellations] = await Promise.all([
        getMySubscriptions(),
        getMyCancellations().catch(() => []),
      ]);
      setSubscriptions(subs);
      setCancellations(myCancellations);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        router.push("/login");
        return;
      }
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
    loadSubscriptions();
  }, []);

  const handleCancel = async (subscription) => {
    if (subscription.status === "CANCEL_RESERVED") {
      alert("이미 해지 예약된 구독입니다.");
      return;
    }
    const endDateStr = subscription.currentPeriodEnd
      ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
      : "기간 만료일";
    if (!confirm(`정말 해지하시겠어요?\n${endDateStr}까지는 계속 이용하실 수 있어요.`)) return;

    setBusyId(subscription.subscriptionId);
    try {
      await unsubscribeMentor(subscription.subscriptionId);
      await loadSubscriptions();
      alert("해지가 예약되었습니다.");
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const toggleHistory = async (subscriptionId) => {
    if (expandedId === subscriptionId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(subscriptionId);
    setHistoryLoading(true);
    try {
      const history = await getPaymentHistory(subscriptionId);
      setPaymentHistory(history);
    } catch (err) {
      alert(err.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleRefundRequest = async (payment) => {
    const reason = window.prompt("환불 사유를 입력해주세요.");
    if (!reason || !reason.trim()) return;

    setBusyId(payment.paymentId);
    try {
      await requestRefund(payment.paymentId, reason.trim());
      alert("환불 요청이 접수되었습니다. 관리자 승인 후 처리됩니다.");
      const myCancellations = await getMyCancellations().catch(() => []);
      setCancellations(myCancellations);
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const cancellationsByPaymentId = cancellations.reduce((acc, c) => {
    acc[c.paymentId] = c;
    return acc;
  }, {});

  if (loading) return <main style={{ maxWidth: 720, margin: "40px auto", padding: "0 16px" }}>불러오는 중...</main>;

  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: "0 16px" }}>
      <h1>내 구독 관리</h1>

      {subscriptions.length === 0 ? (
        <p style={{ color: "#6b7280", marginTop: 24 }}>구독 중인 멘토가 없어요.</p>
      ) : (
        <div style={{ display: "grid", gap: 16, marginTop: 24 }}>
          {subscriptions.map((sub) => {
            const statusInfo = STATUS_LABEL[sub.status] || { text: sub.status, color: "#6b7280" };
            const isExpanded = expandedId === sub.subscriptionId;

            return (
              <div key={sub.subscriptionId} style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h3 style={{ margin: 0 }}>{sub.mentorName}</h3>
                    <span style={{ fontSize: 13, color: statusInfo.color, fontWeight: 600 }}>{statusInfo.text}</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700 }}>월 {Number(sub.amount || 0).toLocaleString()}원</div>
                    {sub.currentPeriodEnd && (
                      <div style={{ fontSize: 12, color: "#6b7280" }}>
                        {sub.status === "CANCEL_RESERVED" ? "이용 종료일" : "다음 결제일"}:{" "}
                        {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button
                    style={btnGhost}
                    onClick={() => toggleHistory(sub.subscriptionId)}
                  >
                    {isExpanded ? "결제 내역 닫기" : "결제 내역 / 환불 요청"}
                  </button>
                  <button
                    style={{ ...btnGhost, color: "#ef4444", borderColor: "#ef4444" }}
                    onClick={() => handleCancel(sub)}
                    disabled={busyId === sub.subscriptionId || sub.status === "CANCEL_RESERVED"}
                  >
                    {sub.status === "CANCEL_RESERVED" ? "해지 예약됨" : "구독 해지"}
                  </button>
                </div>

                {isExpanded && (
                  <div style={{ marginTop: 16, borderTop: "1px solid #e5e7eb", paddingTop: 12 }}>
                    {historyLoading ? (
                      <p style={{ fontSize: 13, color: "#6b7280" }}>불러오는 중...</p>
                    ) : paymentHistory.length === 0 ? (
                      <p style={{ fontSize: 13, color: "#6b7280" }}>결제 이력이 없어요.</p>
                    ) : (
                      <div style={{ display: "grid", gap: 8 }}>
                        {paymentHistory.map((payment) => {
                          const cancellation = cancellationsByPaymentId[payment.paymentId];
                          return (
                            <div key={payment.paymentId} style={paymentRow}>
                              <div>
                                <div style={{ fontSize: 13 }}>
                                  {payment.cycleNo}회차 · {Number(payment.amount).toLocaleString()}원 ·{" "}
                                  {PAYMENT_STATUS_LABEL[payment.status] || payment.status}
                                </div>
                                {payment.paidAt && (
                                  <div style={{ fontSize: 11, color: "#9ca3af" }}>
                                    {new Date(payment.paidAt).toLocaleDateString()} 결제
                                  </div>
                                )}
                              </div>

                              {cancellation ? (
                                <span
                                  style={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: (CANCELLATION_STATUS_LABEL[cancellation.status] || {}).color,
                                  }}
                                >
                                  {(CANCELLATION_STATUS_LABEL[cancellation.status] || {}).text || cancellation.status}
                                </span>
                              ) : payment.status === "PAID" ? (
                                <button
                                  style={btnSmall}
                                  onClick={() => handleRefundRequest(payment)}
                                  disabled={busyId === payment.paymentId}
                                >
                                  환불 요청
                                </button>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

const card = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 16,
};

const btnGhost = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  background: "#fff",
  fontSize: 13,
  cursor: "pointer",
};

const btnSmall = {
  padding: "4px 10px",
  borderRadius: 6,
  border: "1px solid #2563eb",
  background: "#fff",
  color: "#2563eb",
  fontSize: 12,
  cursor: "pointer",
};

const paymentRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "8px 0",
  borderBottom: "1px solid #f3f4f6",
};
