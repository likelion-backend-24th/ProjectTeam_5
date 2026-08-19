"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/contexts/AuthContext";
import { getMentorPlans, deleteMentorPlan } from "@/lib/mentorPlans";

// 프로필 페이지의 "구독 플랜 관리" 카드. 멘토 본인만 보인다.
export default function MentorPlanSection() {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    try {
      const data = await getMentorPlans(user.id);
      setPlans(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("요금제 조회 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // 멘토가 아니면 이 카드 자체를 렌더하지 않는다
  if (!user || user.role !== "MENTOR") return null;

  const handleDelete = async (planId) => {
    if (!confirm("이 요금제를 비활성화할까요? 기존 구독자에게는 영향이 없습니다.")) return;
    try {
      await deleteMentorPlan(user.id, planId);
      await load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <section style={cardBox}>
      <h2 style={{ margin: 0, fontSize: 18 }}>구독 플랜 관리</h2>

      {loading ? (
        <p style={{ color: "#6b7280" }}>불러오는 중...</p>
      ) : plans.length === 0 ? (
        <p style={{ color: "#6b7280", marginTop: 16 }}>
          등록된 요금제가 없습니다. 요금제를 등록해야 멘토 목록에 노출됩니다.
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: "16px 0", display: "grid", gap: 12 }}>
          {plans.map((p) => (
            <li key={p.id} style={planRow}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{p.planName}</div>
                <div style={{ color: "#6b7280", fontSize: 13 }}>
                  {p.price?.toLocaleString()}원 / {p.billingCycle}개월
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <Link href={`/profile/mentor-plans/${p.id}/edit`} style={editBtn}>
                  수정
                </Link>
                <button type="button" style={deleteBtn} onClick={() => handleDelete(p.id)}>
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Link href="/profile/mentor-plans/new" style={addBtn}>
        + 요금제 추가
      </Link>
    </section>
  );
}

const cardBox = { border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, background: "#fff" };
const planRow = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  border: "1px solid #eef0f3",
  borderRadius: 10,
  padding: "12px 14px",
};
const editBtn = {
  border: "1px solid #d1d5db",
  color: "#374151",
  background: "#fff",
  borderRadius: 8,
  padding: "6px 10px",
  cursor: "pointer",
  fontSize: 13,
  textDecoration: "none",
};
const deleteBtn = {
  border: "1px solid #fecaca",
  color: "crimson",
  background: "#fff",
  borderRadius: 8,
  padding: "6px 10px",
  cursor: "pointer",
  fontSize: 13,
};
const addBtn = {
  display: "block",
  textAlign: "center",
  padding: "12px",
  border: "1px dashed #93c5fd",
  borderRadius: 10,
  color: "#2563eb",
  textDecoration: "none",
  marginTop: 12,
};
