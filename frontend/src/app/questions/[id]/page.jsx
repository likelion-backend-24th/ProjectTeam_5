"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import { getQuestion, getAnswers } from "@/lib/questions";

import styles from "./page.module.css";

export default function QuestionDetailPage() {
  const { id } = useParams();

  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadQuestion() {
      setLoading(true);
      setErrorMessage("");

      try {
        // 질문 본문이랑 답변은 API가 따로 나뉘어 있어서 두 번 호출한다.
        const [questionResult, answersResult] = await Promise.all([
          getQuestion(id),
          getAnswers(id),
        ]);

        if (!ignore) {
          setQuestion(questionResult);
          setAnswers(answersResult.content ?? answersResult ?? []);
        }
      } catch (error) {
        console.error("질문 상세 조회 실패:", error);

        if (!ignore) {
          if (error.status === 404) {
            setErrorMessage("삭제되었거나 존재하지 않는 질문입니다.");
          } else {
            setErrorMessage(
              error.message === "Failed to fetch"
                ? "질문을 불러오지 못했습니다."
                : error.message
            );
          }
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadQuestion();

    return () => {
      ignore = true;
    };
  }, [id]);

  return (
    <>
      <main className={styles.page}>
        <Link href="/questions" className={styles.backLink}>
          ← 목록으로
        </Link>

        {loading && <p className={styles.statusText}>불러오는 중...</p>}

        {!loading && errorMessage && (
          <p className={styles.errorMessage}>{errorMessage}</p>
        )}

        {!loading && !errorMessage && question && (
          <section className={styles.panel}>
            <div className={styles.meta}>
              <span>
                작성자: {question.authorName || question.name || "익명"} |{" "}
                {formatDate(question.createdAt)}
              </span>

              {/* TODO: 로그인한 사용자 = 작성자일 때만 보이게 처리 (내 정보 조회 API 필요) */}
              <span className={styles.ownerActions}>
                <button type="button">수정</button>
                <button type="button">삭제</button>
              </span>
            </div>

            <h1>{question.title}</h1>
            <p className={styles.content}>{question.content}</p>

            {question.attachmentName && (
              <div className={styles.attachment}>
                📎 첨부파일: {question.attachmentName}
              </div>
            )}
          </section>
        )}

        {!loading && !errorMessage && question && (
          <section className={styles.answers}>
            <h2>답변 목록 ({answers.length})</h2>

            {answers.length === 0 && (
              <p className={styles.statusText}>아직 등록된 답변이 없습니다.</p>
            )}

            <ul className={styles.answerList}>
              {answers.map((answer) => (
                <li key={answer.id} className={styles.answerItem}>
                  <div className={styles.answerHeader}>
                    <span className={styles.mentorName}>
                      {answer.authorName || answer.name || "익명"}
                      {answer.mentorTitle && ` (${answer.mentorTitle})`}
                    </span>

                    <span className={styles.answerDate}>
                      {formatDate(answer.createdAt)}
                    </span>

                    {/* TODO: 로그인한 사용자 = 답변 작성자일 때만 보이게 처리 */}
                    <span className={styles.ownerActions}>
                      <button type="button">수정</button>
                      <button type="button">삭제</button>
                    </span>
                  </div>

                  <p>{answer.content}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
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
