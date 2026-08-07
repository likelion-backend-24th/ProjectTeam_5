"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createQuestion } from "@/lib/questions";

import styles from "./form.module.css";

export default function NewQuestionPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSubmitting(true);

    try {
      const question = await createQuestion(title, content);
      router.push(`/questions/${question.id}`);
    } catch (error) {
      setErrorMessage(error.message);
      setSubmitting(false);
    }
  };

  return (
    <>
      <main className={styles.page}>
        <h1>새 질문 작성 / 수정하기</h1>

        <form onSubmit={handleSubmit} className={styles.panel}>
          <div className={styles.field}>
            <div className={styles.fieldHeader}>
              <label htmlFor="title">질문 제목</label>
              <span>{title.length}/100</span>
            </div>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              required
            />
          </div>

          <div className={styles.field}>
            <div className={styles.fieldHeader}>
              <label htmlFor="content">질문 내용</label>
              <span>{content.length}/5000</span>
            </div>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={5000}
              rows={8}
              required
            />
          </div>

          {/* 파일 업로드는 백엔드 미지원, UI만 있음 */}
          <div className={styles.field}>
            <label>파일 첨부</label>
            <input type="file" disabled />
          </div>

          {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={() => router.back()}
            >
              취소
            </button>
            <button type="submit" className={styles.submitButton} disabled={submitting}>
              {submitting ? "등록 중..." : "질문 등록 / 수정 완료"}
            </button>
          </div>
        </form>
      </main>
    </>
  );
}
