"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { getQuestion, updateQuestion } from "@/lib/questions";

import styles from "../../new/form.module.css";

export default function EditQuestionPage() {
  const { id } = useParams();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let ignore = false;

    getQuestion(id)
      .then((question) => {
        if (!ignore) {
          setTitle(question.title);
          setContent(question.content);
        }
      })
      .catch((error) => {
        if (!ignore) setErrorMessage(error.message);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [id]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSubmitting(true);

    try {
      await updateQuestion(id, title, content);
      router.push(`/questions/${id}`);
    } catch (error) {
      setErrorMessage(error.message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className={styles.page}>
        <p>불러오는 중...</p>
      </main>
    );
  }

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
              {submitting ? "저장 중..." : "질문 등록 / 수정 완료"}
            </button>
          </div>
        </form>
      </main>
    </>
  );
}
