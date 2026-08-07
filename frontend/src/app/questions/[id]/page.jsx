"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import {
  getQuestion,
  getAnswers,
  createAnswer,
  updateAnswer,
  deleteAnswer,
} from "@/lib/questions";
import { getMe } from "@/lib/auth";

import AnswerForm from "../answers/AnswerForm";
import AnswerList from "../answers/AnserList";
import styles from "./page.module.css";

export default function QuestionDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAnswers = useCallback(async () => {
    try {
      const answersResult = await getAnswers(id);
      setAnswers(answersResult.content ?? answersResult ?? []);
    } catch (error) {
      console.error("답변 목록 조회 실패:", error);
    }
  }, [id]);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      setLoading(true);
      setErrorMessage("");

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("token") || localStorage.getItem("accessToken")
          : null;

      try {
        const [questionResult, answersResult, userResult] = await Promise.all([
          getQuestion(id),
          getAnswers(id),
          token ? getMe(token).catch(() => null) : Promise.resolve(null),
        ]);

        if (!ignore) {
          setQuestion(questionResult);
          setAnswers(answersResult.content ?? answersResult ?? []);
          setCurrentUser(userResult);
        }
      } catch (error) {
        console.error("데이터 조회 실패:", error);

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

    if (id) {
      loadData();
    }

    return () => {
      ignore = true;
    };
  }, [id]);

  const handleCreateAnswer = async (content, resetForm) => {
    try {
      setIsSubmitting(true);
      await createAnswer(id, { content });
      resetForm();
      await fetchAnswers();
    } catch (error) {
      alert(error.message || "답변 등록에 실패했습니다.");
      if (error.status === 401 || error.status === 403) {
        router.push("/login");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateAnswer = async (answerId, content) => {
    try {
      await updateAnswer(answerId, { content });
      await fetchAnswers();
    } catch (error) {
      alert(error.message || "답변 수정에 실패했습니다.");
      if (error.status === 401 || error.status === 403) {
        router.push("/login");
      }
      throw error;
    }
  };

  const handleDeleteAnswer = async (answerId) => {
    if (!confirm("정말 이 답변을 삭제하시겠습니까?")) return;

    try {
      await deleteAnswer(answerId);
      await fetchAnswers();
    } catch (error) {
      alert(error.message || "답변 삭제에 실패했습니다.");
      if (error.status === 401 || error.status === 403) {
        router.push("/login");
      }
    }
  };

  const isQuestionOwner =
    currentUser &&
    question &&
    (currentUser.id === question.authorId ||
      currentUser.id === question.userId ||
      currentUser.id === question.author?.id ||
      currentUser.name === question.authorName);

  return (
    <main className={styles.page}>
      <Link href="/questions" className={styles.backLink}>
        ← 목록으로
      </Link>

      {loading && <p className={styles.statusText}>불러오는 중...</p>}

      {!loading && errorMessage && (
        <p className={styles.errorMessage}>{errorMessage}</p>
      )}

      {!loading && !errorMessage && question && (
        <>
          <section className={styles.panel}>
            <div className={styles.meta}>
              <span>
                작성자: {question.authorName || question.name || "익명"} |{" "}
                {formatDate(question.createdAt)}
              </span>

              {isQuestionOwner && (
                <span className={styles.ownerActions}>
                  <button type="button">수정</button>
                  <button type="button">삭제</button>
                </span>
              )}
            </div>

            <h1>{question.title}</h1>
            <p className={styles.content}>{question.content}</p>

            {question.attachmentName && (
              <div className={styles.attachment}>
                📎 첨부파일: {question.attachmentName}
              </div>
            )}
          </section>

          <section className={styles.answers}>
            <h2>답변 목록 ({answers.length})</h2>

            <AnswerForm
              onSubmit={handleCreateAnswer}
              isSubmitting={isSubmitting}
              currentUser={currentUser}
            />

            <AnswerList
              answers={answers}
              currentUser={currentUser}
              onUpdate={handleUpdateAnswer}
              onDelete={handleDeleteAnswer}
              formatDate={formatDate}
            />
          </section>
        </>
      )}
    </main>
  );
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}