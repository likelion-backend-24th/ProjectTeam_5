"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { getQuestions } from "@/lib/questions";

import styles from "./page.module.css";

export default function QuestionsPage() {
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadQuestions() {
      setLoading(true);
      setErrorMessage("");

      try {
        const result = await getQuestions(page, 10);

        if (!ignore) {
          setData(result);
        }
      } catch (error) {
        console.error("질문 목록 조회 실패:", error);

        if (!ignore) {
          setErrorMessage(
            error.message || "질문 목록을 불러오지 못했습니다."
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadQuestions();

    return () => {
      ignore = true;
    };
  }, [page]);

  const questions = data?.content ?? [];
  const totalElements = data?.totalElements ?? 0;
  const hasNextPage = (page + 1) * 10 < totalElements;

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <Link href="/" className={styles.brand}>
          <span className={styles.logo}>M</span>
          <span>MentorBridge</span>
        </Link>

        <h1>질문 목록</h1>
      </div>

      {loading && <p className={styles.statusText}>불러오는 중...</p>}

      {!loading && errorMessage && (
        <p className={styles.errorMessage}>{errorMessage}</p>
      )}

      {!loading && !errorMessage && questions.length === 0 && (
        <p className={styles.statusText}>아직 등록된 질문이 없습니다.</p>
      )}

      {!loading && !errorMessage && questions.length > 0 && (
        <ul className={styles.list}>
          {questions.map((question) => (
            <li key={question.id} className={styles.listItem}>
              <Link href={`/questions/${question.id}`}>
                <h2>{question.title}</h2>
                <span className={styles.author}>
                  {question.authorName || question.name || "익명"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className={styles.pagination}>
        <button
          type="button"
          onClick={() => setPage((previous) => Math.max(previous - 1, 0))}
          disabled={page === 0 || loading}
        >
          이전
        </button>

        <span>{page + 1} 페이지</span>

        <button
          type="button"
          onClick={() => setPage((previous) => previous + 1)}
          disabled={!hasNextPage || loading}
        >
          다음
        </button>
      </div>
    </main>
  );
}
