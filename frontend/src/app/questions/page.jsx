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
            error.message === "Failed to fetch"
              ? "질문 목록을 불러오지 못했습니다."
              : error.message
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
  const totalPages = Math.max(Math.ceil(totalElements / 10), 1);

  return (
    <>
      <main className={styles.page}>
        <div className={styles.heading}>
          <div>
            <h1>질문 피드</h1>
            <p>취업 준비생들이 올린 현실적인 질문들을 확인해보세요 (비로그인 조회 가능)</p>
          </div>

          <Link href="/questions/new" className={styles.askButton}>
            질문하기
          </Link>
        </div>

        <section className={styles.panel}>
          {loading && <p className={styles.statusText}>불러오는 중...</p>}

          {!loading && errorMessage && (
            <p className={styles.errorMessage}>{errorMessage}</p>
          )}

          {!loading && !errorMessage && questions.length === 0 && (
            <p className={styles.statusText}>아직 등록된 질문이 없습니다.</p>
          )}

          {!loading && !errorMessage && questions.length > 0 && (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>질문 제목</th>
                  <th>작성자</th>
                  <th>답변수</th>
                  <th>등록일</th>
                </tr>
              </thead>

              <tbody>
                {questions.map((question) => (
                  <tr key={question.id}>
                    <td>
                      <Link href={`/questions/${question.id}`}>
                        {question.title}
                      </Link>
                    </td>
                    <td>{question.authorName || question.name || "익명"}</td>
                    <td>
                      <span className={styles.answerCount}>
                        {question.answerCount ?? 0}개
                      </span>
                    </td>
                    <td>{formatDate(question.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className={styles.pagination}>
            <button
              type="button"
              onClick={() => setPage((previous) => Math.max(previous - 1, 0))}
              disabled={page === 0 || loading}
            >
              {"<"}
            </button>

            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                type="button"
                className={index === page ? styles.pageActive : undefined}
                onClick={() => setPage(index)}
                disabled={loading}
              >
                {index + 1}
              </button>
            ))}

            <button
              type="button"
              onClick={() =>
                setPage((previous) => Math.min(previous + 1, totalPages - 1))
              }
              disabled={page + 1 >= totalPages || loading}
            >
              {">"}
            </button>
          </div>
        </section>
      </main>
    </>
  );
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}.${month}.${day}`;
}
