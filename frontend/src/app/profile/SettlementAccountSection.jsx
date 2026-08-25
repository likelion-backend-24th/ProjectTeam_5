"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { getMySettlementAccount, saveOrUpdateSettlementAccount } from "@/lib/settlements";

export default function SettlementAccountSection() {
    const { user } = useAuth();
    const [account, setAccount] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        bankName: "",
        accountNumber: "",
        accountHolder: "",
    });

    const loadAccount = async () => {
        if (!user || user.role !== "MENTOR") {
            setLoading(false);
            return;
        }
        try {
            const data = await getMySettlementAccount();
            setAccount(data);
            setForm({
                bankName: data.bankName,
                accountNumber: data.accountNumber,
                accountHolder: data.accountHolder,
            });
        } catch (err) {
            // 404 에러(아직 등록 안 됨)는 무시
            if (err.status !== 404) {
                console.error("계좌 조회 실패:", err);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAccount();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    if (!user || user.role !== "MENTOR") return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.bankName.trim() || !form.accountNumber.trim() || !form.accountHolder.trim()) {
            alert("모든 정보를 정확히 입력해주세요.");
            return;
        }

        setSubmitting(true);
        try {
            const res = await saveOrUpdateSettlementAccount({
                bankName: form.bankName.trim(),
                accountNumber: form.accountNumber.replace(/[^0-9-]/g, ""), // 숫자와 하이픈만 허용
                accountHolder: form.accountHolder.trim(),
            });
            setAccount(res);
            setIsEditing(false);
            alert("정산 계좌가 성공적으로 저장되었습니다.");
        } catch (err) {
            alert(err.message || "계좌 저장에 실패했습니다.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        if (account) {
            setForm({
                bankName: account.bankName,
                accountNumber: account.accountNumber,
                accountHolder: account.accountHolder,
            });
        } else {
            setForm({ bankName: "", accountNumber: "", accountHolder: "" });
        }
    };

    // 계좌번호 일부 마스킹 처리 (예: 110-***-1234)
    const maskAccount = (num) => {
        if (!num || num.length < 6) return num;
        return num.slice(0, 3) + " - **** - " + num.slice(-4);
    };

    return (
        <section style={cardBox}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h2 style={{ margin: 0, fontSize: 18 }}>정산 계좌 관리</h2>
                {!isEditing && account && (
                    <button style={editBtn} onClick={() => setIsEditing(true)}>수정</button>
                )}
            </div>

            {loading ? (
                <p style={{ color: "#6b7280" }}>불러오는 중...</p>
            ) : isEditing || !account ? (
                <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
                    <div style={inputGroup}>
                        <label style={label}>은행명</label>
                        <input style={input} value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} placeholder="예: 신한은행, 토스뱅크" maxLength={20} required />
                    </div>
                    <div style={inputGroup}>
                        <label style={label}>계좌번호</label>
                        <input style={input} value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} placeholder="- 포함해서 입력" required />
                    </div>
                    <div style={inputGroup}>
                        <label style={label}>예금주명</label>
                        <input style={input} value={form.accountHolder} onChange={(e) => setForm({ ...form, accountHolder: e.target.value })} placeholder="예: 홍길동" maxLength={20} required />
                    </div>

                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        {account && (
                            <button type="button" onClick={handleCancel} style={btnGhost}>취소</button>
                        )}
                        <button type="submit" disabled={submitting} style={btnPrimary}>
                            {submitting ? "저장 중..." : "저장하기"}
                        </button>
                    </div>
                </form>
            ) : (
                <div style={accountInfoBox}>
                    <div style={{ fontSize: 14, color: "#374151" }}>
                        <strong>{account.bankName}</strong> {maskAccount(account.accountNumber)}
                    </div>
                    <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
                        예금주: {account.accountHolder}
                    </div>
                </div>
            )}
        </section>
    );
}

// 스타일 모음
const cardBox = { border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, background: "#fff" };
const editBtn = { border: "1px solid #d1d5db", color: "#374151", background: "#fff", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 12 };
const inputGroup = { display: "grid", gap: 6 };
const label = { fontSize: 13, fontWeight: 600, color: "#374151" };
const input = { padding: "10px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, fontFamily: "inherit" };
const btnGhost = { flex: 1, padding: "10px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", fontSize: 14 };
const btnPrimary = { flex: 1, padding: "10px", borderRadius: 8, border: "none", background: "#2563eb", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: "bold" };
const accountInfoBox = { padding: "16px", borderRadius: 8, backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" };