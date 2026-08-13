"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getPaymentMethods,
  deletePaymentMethod,
  setDefaultPaymentMethod,
} from "@/lib/payments";

// 프로필 페이지의 "결제 수단 관리" 카드.
// 현재 백엔드(등록/목록/삭제/대표지정)로 붙일 수 있는 것만 표시한다.
// 유효기간·결제내역·구독현황은 백엔드 준비 후 추가(지금은 렌더하지 않음).
export default function ProfilePaymentSection() {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState(null); // ⋮ 드롭다운 열림 상태

  const load = async () => {
    try {
      const data = await getPaymentMethods();
      setMethods(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("결제수단 조회 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (id) => {
    setOpenMenuId(null);
    if (!confirm("이 결제수단을 삭제할까요?")) return;
    try {
      await deletePaymentMethod(id);
      await load();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSetDefault = async (id) => {
    setOpenMenuId(null);
    try {
      await setDefaultPaymentMethod(id);
      await load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <section style={cardBox}>
      <h2 style={{ margin: 0, fontSize: 18 }}>결제 수단 관리</h2>

      {loading ? (
        <p style={{ color: "#6b7280" }}>불러오는 중...</p>
      ) : methods.length === 0 ? (
        <p style={{ color: "#6b7280", marginTop: 16 }}>등록된 결제수단이 없습니다.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: "16px 0", display: "grid", gap: 12 }}>
          {methods.map((m) => (
            <li key={m.id} style={methodRow}>
              {/* 브랜드 박스 (로고 대신 브랜드 텍스트) */}
              <div style={brandBox}>{m.brand}</div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>
                  {m.brand} •••• {m.last4}
                </div>
                {m.cardNickname && (
                  <div style={{ color: "#6b7280", fontSize: 13 }}>{m.cardNickname}</div>
                )}
              </div>

              {m.isDefault && <span style={defaultBadge}>기본 카드</span>}

              {/* ⋮ 메뉴 */}
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  aria-label="메뉴"
                  onClick={() => setOpenMenuId(openMenuId === m.id ? null : m.id)}
                  style={dotsBtn}
                >
                  ⋮
                </button>
                {openMenuId === m.id && (
                  <div style={dropdown}>
                    {!m.isDefault && (
                      <button type="button" style={dropdownItem} onClick={() => handleSetDefault(m.id)}>
                        대표로 지정
                      </button>
                    )}
                    <button
                      type="button"
                      style={{ ...dropdownItem, color: "crimson" }}
                      onClick={() => handleDelete(m.id)}
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* + 결제 수단 추가 → 등록 페이지로 이동 */}
      <Link href="/profile/payment-methods/new" style={addBtn}>
        + 결제 수단 추가
      </Link>
    </section>
  );
}

// ===== 인라인 스타일 =====
const cardBox = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 20,
  background: "#fff",
};
const methodRow = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  border: "1px solid #eef0f3",
  borderRadius: 10,
  padding: "12px 14px",
};
const brandBox = {
  width: 48,
  height: 32,
  borderRadius: 6,
  background: "#1a1f71",
  color: "#fff",
  fontSize: 11,
  fontWeight: 700,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};
const defaultBadge = {
  fontSize: 12,
  color: "#2563eb",
  background: "#eff6ff",
  borderRadius: 6,
  padding: "2px 8px",
  whiteSpace: "nowrap",
};
const dotsBtn = {
  border: "none",
  background: "transparent",
  fontSize: 20,
  cursor: "pointer",
  lineHeight: 1,
};
const dropdown = {
  position: "absolute",
  right: 0,
  top: 28,
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  display: "grid",
  minWidth: 120,
  zIndex: 10,
};
const dropdownItem = {
  border: "none",
  background: "transparent",
  padding: "10px 14px",
  textAlign: "left",
  cursor: "pointer",
  fontSize: 14,
};
const addBtn = {
  display: "block",
  textAlign: "center",
  padding: "12px",
  border: "1px dashed #93c5fd",
  borderRadius: 10,
  color: "#2563eb",
  textDecoration: "none",
};
