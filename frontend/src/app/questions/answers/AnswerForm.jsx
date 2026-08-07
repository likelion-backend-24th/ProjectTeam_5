"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function AnswerForm({ onSubmit, isSubmitting, currentUser }) {
  const [content, setContent] = useState("");
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!currentUser) {
      if (confirm("로그인이 필요한 서비스입니다. 로그인 페이지로 이동하시겠습니까?")) {
        router.push("/login");
      }
      return;
    }

    if (!content.trim()) {
      alert("답변 내용을 입력해 주세요.");
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
            ? "답변을 작성해 주세요."
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
    </form>
  );
}