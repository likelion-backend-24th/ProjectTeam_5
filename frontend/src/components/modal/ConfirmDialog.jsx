"use client";

import { useState } from "react";
import styles from "./ConfirmDialog.module.css";

// 돈이 걸린 액션(해지·환불·삭제 등)에서 window.confirm()/window.prompt() 대신 쓰는
// 공용 확인 모달. showInput을 켜면 (환불 사유처럼) 텍스트 입력도 같이 받는다.
export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "확인",
  cancelLabel = "취소",
  danger = false,
  showInput = false,
  inputLabel,
  inputPlaceholder,
  inputRequired = false,
  submitting = false,
  onConfirm,
  onCancel,
}) {
  const [inputValue, setInputValue] = useState("");

  if (!isOpen) return null;

  const blocked = showInput && inputRequired && !inputValue.trim();

  const handleConfirm = () => {
    if (blocked || submitting) return;
    onConfirm(showInput ? inputValue.trim() : undefined);
    setInputValue("");
  };

  const handleCancel = () => {
    if (submitting) return;
    setInputValue("");
    onCancel();
  };

  return (
    <div className={styles.overlay} onClick={handleCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{title}</h2>
        </div>
        <div className={styles.content}>
          {message && <p className={styles.message}>{message}</p>}
          {showInput && (
            <div className={styles.inputGroup}>
              {inputLabel && <label className={styles.inputLabel}>{inputLabel}</label>}
              <textarea
                className={styles.textarea}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={inputPlaceholder}
                rows={3}
                autoFocus
                disabled={submitting}
              />
            </div>
          )}
        </div>
        <div className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={handleCancel} disabled={submitting}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={danger ? styles.dangerBtn : styles.confirmBtn}
            onClick={handleConfirm}
            disabled={submitting || blocked}
          >
            {submitting ? "처리 중..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
