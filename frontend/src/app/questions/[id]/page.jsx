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
            setErrorMessage(error.message || "질문을 불러오지 못했습니다.");
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

  if (loading) {
    return (
      <main className={styles.page}>
        <p className={styles.statusText}>불러오는 중...</p>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className={styles.page}>
        <p className={styles.errorMessage}>{errorMessage}</p>
        <Link href="/questions" className={styles.backLink}>
          목록으로
        </Link>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <Link href="/questions" className={styles.backLink}>
        ← 목록으로
      </Link>

      <article className={styles.question}>
        <h1>{question.title}</h1>
        <span className={styles.author}>
          {question.authorName || question.name || "익명"}
        </span>
        <p className={styles.content}>{question.content}</p>
      </article>

      <section className={styles.answers}>
        <h2>답변 {answers.length}개</h2>

        {answers.length === 0 && (
          <p className={styles.statusText}>아직 등록된 답변이 없습니다.</p>
        )}

        <ul className={styles.answerList}>
          {answers.map((answer) => (
            <li key={answer.id} className={styles.answerItem}>
              <span className={styles.author}>
                {answer.authorName || answer.name || "익명"}
              </span>
              <p>{answer.content}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
