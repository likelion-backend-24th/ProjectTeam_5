"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import styles from "./ToastContext.module.css";

const ToastContext = createContext(null);

let idSeq = 0;

// alert()를 대체하는 결과 안내용 토스트. confirm()/prompt() 대체는 components/modal/ConfirmDialog 몫이고,
// 이건 "액션이 끝난 뒤 성공/실패를 알려주기만 하면 되는" 자리에 쓴다.
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const showToast = useCallback(
    (message, type = "info") => {
      if (!message) return;
      const id = ++idSeq;
      setToasts((prev) => [...prev, { id, message, type }]);
      timers.current[id] = setTimeout(() => removeToast(id), 3500);
    },
    [removeToast]
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.container} aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`${styles.toast} ${styles[t.type] || styles.info}`}
            onClick={() => removeToast(t.id)}
            role="status"
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast는 ToastProvider 안에서만 사용하세요");
  return ctx;
}
