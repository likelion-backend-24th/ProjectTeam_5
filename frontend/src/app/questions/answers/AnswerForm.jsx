"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/modal/ConfirmDialog";
import { useToast } from "@/app/contexts/ToastContext";
import styles from "./page.module.css";

export default function AnswerForm({
  onSubmit,
  isSubmitting,
  currentUser,
  placeholder
}) {
  const [content, setContent] = useState("");
  const [showLoginConfirm, setShowLoginConfirm] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!currentUser) {
      setShowLoginConfirm(true);
      return;
    }

    if (!content.trim()) {
      showToast("답변 내용을 입력해 주세요.", "error");
      return;
    }

    onSubmit(content, () => setContent(""));
  };

  return (
    <form onSubmit={handleSubmit} className={styles.answerForm}>
      <textarea
        className={styles.answerInput}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={
          currentUser
            ? placeholder || "답변을 작성해 주세요."
            : "로그인 후 답변을 작성할 수 있습니다."
        }
        rows={4}
        disabled={isSubmitting || !currentUser}
      />
      <div className={styles.formActions}>
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={isSubmitting || !currentUser}
        >
          {isSubmitting ? "등록 중..." : "답변 등록"}
        </button>
      </div>

      <ConfirmDialog
        isOpen={showLoginConfirm}
        title="로그인이 필요합니다"
        message="로그인이 필요한 서비스입니다. 로그인 페이지로 이동하시겠습니까?"
        confirmLabel="이동"
        onConfirm={() => {
          setShowLoginConfirm(false);
          router.push("/login");
        }}
        onCancel={() => setShowLoginConfirm(false)}
      />
    </form>
  );
}