"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { createMentorPlan } from "@/lib/mentorPlans";

export default function MentorPlanNewPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [planName, setPlanName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [billingCycle, setBillingCycle] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!planName.trim()) return setErrorMessage("요금제 이름을 입력하세요.");
    if (!price || Number(price) <= 0) return setErrorMessage("가격은 0보다 커야 합니다.");
    if (!user?.id) return setErrorMessage("로그인이 필요합니다.");

    setSubmitting(true);
    try {
      await createMentorPlan(user.id, {
        planName: planName.trim(),
        description: description.trim(),
        price: Number(price),
        billingCycle: Number(billingCycle),
      });
      alert("요금제가 등록됐습니다. 이제 멘토 목록에 노출됩니다.");
      router.push("/profile"); // 등록 성공 → 프로필로 복귀
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        router.push("/login");
        return;
      }
      setErrorMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main style={{ maxWidth: 480, margin: "40px auto", padding: "0 16px" }}>
      <h1>구독 플랜 등록</h1>
      <p style={{ color: "#6b7280", fontSize: 14 }}>
        요금제를 등록해야 멘토 목록에 노출되고 사용자가 구독할 수 있습니다.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, marginTop: 24 }}>
        <label style={label}>
          요금제 이름
          <input
            style={input}
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            placeholder="베이직 구독"
            maxLength={50}
          />
        </label>

        <label style={label}>
          설명
          <textarea
            style={{ ...input, minHeight: 80, resize: "vertical" }}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="이 요금제로 제공하는 혜택을 적어주세요."
          />
        </label>

        <label style={label}>
          월 구독료 (원)
          <input
            style={input}
            value={price}
            onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
          />
        </label>

        <label style={label}>
          결제 주기
          <select style={input} value={billingCycle} onChange={(e) => setBillingCycle(e.target.value)}>
            <option value={1}>매월</option>
            <option value={3}>3개월</option>
            <option value={12}>연간</option>
          </select>
        </label>

        {errorMessage && <p style={{ color: "crimson" }}>{errorMessage}</p>}

        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <button type="button" onClick={() => router.back()} style={btnGhost}>
            취소
          </button>
          <button type="submit" disabled={submitting} style={btnPrimary}>
            {submitting ? "등록 중..." : "등록"}
          </button>
        </div>
      </form>
    </main>
  );
}

const label = { display: "grid", gap: 6, fontSize: 14 };
const input = {
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  fontSize: 14,
  fontFamily: "inherit",
};
const btnGhost = {
  flex: 1,
  padding: "10px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  background: "#fff",
  cursor: "pointer",
};
const btnPrimary = {
  flex: 1,
  padding: "10px",
  borderRadius: 8,
  border: "none",
  background: "#2563eb",
  color: "#fff",
  cursor: "pointer",
};
