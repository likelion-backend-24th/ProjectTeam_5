"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { requestIssueBillingKey } from "@portone/browser-sdk/v2";
import { useAuth } from "@/app/contexts/AuthContext";
import { prepareBillingKeyIssuance, registerPaymentMethod } from "@/lib/payments";

export default function PaymentMethodNewPage() {
  return (
    <Suspense fallback={null}>
      <PaymentMethodNewForm />
    </Suspense>
  );
}

function PaymentMethodNewForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/profile";
  const { user: authUser } = useAuth();

  const [cardNickname, setCardNickname] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!cardNickname.trim()) return setErrorMessage("카드 별칭을 입력하세요.");
    if (!/^01[0-9]{8,9}$/.test(phoneNumber.trim())) {
      return setErrorMessage("올바른 휴대폰 번호를 입력해주세요. (예: 01012345678)");
    }

    setSubmitting(true);
    try {
      const prepareRes = await prepareBillingKeyIssuance();

      const issueResult = await requestIssueBillingKey({
        storeId: prepareRes.storeId,
        channelKey: prepareRes.channelKey,
        billingKeyMethod: "CARD",
        issueId: prepareRes.issueId,
        issueName: "MentorBridge 결제수단 등록",
        // 이니시스 V2는 구매자 이름/휴대폰번호/이메일이 필수라 안 넣으면 등록창 자체가 안 열린다.
        customer: {
          fullName: authUser?.name,
          phoneNumber: phoneNumber.trim(),
          email: authUser?.email,
        },
      });

      if (issueResult?.code) {
        // 사용자가 카드 등록창을 닫았거나 PG 승인이 거부된 경우
        setErrorMessage(issueResult.message || "카드 등록이 취소되었습니다.");
        return;
      }

      await registerPaymentMethod({
        cardNickname: cardNickname.trim(),
        issueId: prepareRes.issueId,
        billingKey: issueResult.billingKey,
        phoneNumber: phoneNumber.trim(),
      });

      router.push(redirectTo); // 등록 성공 → 원래 있던 곳(없으면 프로필)으로 복귀
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
          휴대폰 번호
          <input
            style={input}
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            maxLength={11}
            placeholder="01012345678"
          />
        </label>

        <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
          등록 버튼을 누르면 PortOne 결제창이 열리고, 거기서 카드 정보를 직접 입력합니다. 카드번호는 저희 서버에 저장되지 않습니다.
        </p>

        {errorMessage && <p style={{ color: "crimson" }}>{errorMessage}</p>}

        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <button type="button" onClick={() => router.back()} style={btnGhost}>
            취소
          </button>
          <button type="submit" disabled={submitting} style={btnPrimary}>
            {submitting ? "등록 중..." : "카드 등록하기"}
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
