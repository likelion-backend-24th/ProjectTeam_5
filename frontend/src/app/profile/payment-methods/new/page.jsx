"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerPaymentMethod } from "@/lib/payments";

export default function PaymentMethodNewPage() {
  const router = useRouter();

  const [cardNickname, setCardNickname] = useState("");
  const [brand, setBrand] = useState("SHINHAN");
  const [last4, setLast4] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!cardNickname.trim()) return setErrorMessage("카드 별칭을 입력하세요.");
    if (!/^\d{4}$/.test(last4)) return setErrorMessage("마지막 4자리는 숫자 4자리여야 합니다.");

    setSubmitting(true);
    try {
      await registerPaymentMethod({ cardNickname: cardNickname.trim(), brand, last4 });
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
      <h1>카드 등록</h1>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, marginTop: 24 }}>
        <label style={label}>
          카드 별칭
          <input
            style={input}
            value={cardNickname}
            onChange={(e) => setCardNickname(e.target.value)}
            placeholder="내 신한카드"
            maxLength={50}
          />
        </label>

        <label style={label}>
          카드사
          <select style={input} value={brand} onChange={(e) => setBrand(e.target.value)}>
            <option value="SHINHAN">신한</option>
            <option value="KB">국민</option>
            <option value="SAMSUNG">삼성</option>
            <option value="HYUNDAI">현대</option>
            <option value="WOORI">우리</option>
          </select>
        </label>

        <label style={label}>
          카드 마지막 4자리
          <input
            style={input}
            value={last4}
            onChange={(e) => setLast4(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            maxLength={4}
            placeholder="1234"
          />
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
