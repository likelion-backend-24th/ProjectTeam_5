"use client";

import { request } from "@/lib/client";
import { useState } from "react";
import styles from "./TermsModal.module.css";

export default function InquiryModal({ isOpen, onClose }) {
  const [form, setForm] = useState({
    category: "일반문의",
    email: "",
    title: "",
    content: "",
  });
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  if (!form.email || !form.title || !form.content) {
    alert("이메일, 제목, 내용을 모두 입력해주세요.");
    return;
  }

  setSubmitting(true);
  try {
    // 👇 실제 백엔드 API로 데이터를 전송하도록 수정
    await request("/api/v1/inquiries", {
      method: "POST",
      body: form, // request 함수 내부에서 JSON.stringify 처리를 해준다면 그대로 전달
      fallbackMessage: "문의 및 신고 접수에 실패했습니다.",
    });

    alert("문의 및 신고가 성공적으로 접수되었습니다. 빠른 시일 내에 답변해 드리겠습니다.");
    setForm({ category: "일반문의", email: "", title: "", content: "" });
    onClose();
  } catch (error) {
    console.error(error);
    alert(error.message || "접수 중 오류가 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
  } finally {
    setSubmitting(false);
  }
};

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>고객 문의 및 신고</h2>
          <button onClick={onClose} className={styles.closeBtn}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.content}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "#374151" }}>
              문의 유형
            </label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "14px" }}
            >
              <option value="일반문의">일반 문의</option>
              <option value="결제/구독">결제 및 구독 문의</option>
              <option value="멘토링신청">멘토링 관련 문의</option>
              <option value="신고">부적절한 사용자/게시글 신고</option>
              <option value="기타">기타</option>
            </select>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "#374151" }}>
              회신 받을 이메일
            </label>
            <input
              type="email"
              name="email"
              placeholder="example@email.com"
              value={form.email}
              onChange={handleChange}
              required
              style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "14px", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "#374151" }}>
              제목
            </label>
            <input
              type="text"
              name="title"
              placeholder="문의 혹은 신고 제목을 입력하세요"
              value={form.title}
              onChange={handleChange}
              required
              style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "14px", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "#374151" }}>
              내용 (상세 내용 및 신고 사유)
            </label>
            <textarea
              name="content"
              rows={5}
              placeholder="문의하실 내용이나 신고할 대상의 상세 내용을 적어주세요."
              value={form.content}
              onChange={handleChange}
              required
              style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "14px", boxSizing: "border-box", resize: "vertical" }}
            />
          </div>

          <div className={styles.footer} style={{ padding: 0, border: "none", marginTop: "20px" }}>
            <button type="submit" className={styles.confirmBtn} disabled={submitting} style={{ width: "100%", padding: "12px" }}>
              {submitting ? "접수 중..." : "문의/신고 접수하기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}