"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getQuestions } from "@/lib/questions";

import styles from "./page.module.css";

const CATEGORIES = ["전체", "개발", "멘토링", "취업", "기타"];

export default function QuestionsPage() {
  const router = useRouter();

  const [page, setPage] = useState(0);
  // 카테고리 상태 추가 (기본값: 전체)
  const [category, setCategory] = useState("전체");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadQuestions() {
      setLoading(true);
      setErrorMessage("");

      try {
        // 객체 형태로 page, size, category 전달
        const result = await getQuestions({ page, size: 10, category });

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
  }, [page, category]); // category가 변경될 때도 데이터를 다시 불러오도록 의존성 배열에 추가

  // 카테고리 탭 클릭 핸들러
  const handleCategoryChange = (newCategory) => {
    if (category !== newCategory) {
      setCategory(newCategory);
      setPage(0); // 카테고리가 바뀌면 1페이지(index 0)로 초기화
    }
  };

  const questions = data?.content ?? [];
  const totalElements = data?.totalElements ?? 0;
  const totalPages = Math.max(Math.ceil(totalElements / 10), 1);

  // 질문하기 버튼 클릭 핸들러
  const handleAskClick = () => {
    // TODO: 프로젝트의 실제 로그인 검증 로직으로 대체하세요.
    // 예: localStorage.getItem("accessToken"), AuthContext의 user 객체 등
    const isLoggedIn = Boolean(localStorage.getItem("accessToken"));

    if (!isLoggedIn) {
      alert("질문 등록은 로그인 후 이용 가능합니다.");
      router.push("/login");
      return;
    }

    router.push("/questions/new");
  };

  return (
      <>
        <main className={styles.page}>
          <div className={styles.heading}>
            <div>
              <h1>질문 피드</h1>
              <p>취업 준비생들이 올린 현실적인 질문들을 확인해보세요 (비로그인 조회 가능)</p>
            </div>

            <button
                type="button"
                onClick={handleAskClick}
                className={styles.askButton}
            >
              질문하기
            </button>
          </div>

          <section className={styles.panel}>
            {/* 카테고리 탭 버튼 UI */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
              {CATEGORIES.map((cat) => (
                  <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategoryChange(cat)}
                      style={{
                        padding: "6px 16px",
                        borderRadius: "20px",
                        border: category === cat ? "none" : "1px solid #e5e7eb",
                        backgroundColor: category === cat ? "#2867e8" : "#ffffff",
                        color: category === cat ? "#ffffff" : "#526176",
                        fontWeight: category === cat ? "700" : "500",
                        fontSize: "14px",
                        cursor: "pointer",
                      }}
                  >
                    {cat}
                  </button>
              ))}
            </div>

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
                    {/* 분류 열 추가 */}
                    <th style={{ width: "80px", textAlign: "center" }}>분류</th>
                    <th>질문 제목</th>
                    <th>작성자</th>
                    <th>답변수</th>
                    <th>등록일</th>
                  </tr>
                  </thead>

                  <tbody>
                  {questions.map((question) => (
                      <tr key={question.id}>
                        {/* 카테고리 데이터 표시 */}
                        <td style={{ textAlign: "center" }}>
                      <span style={{ color: "#2867e8", fontSize: "13px", fontWeight: "bold" }}>
                        [{question.category || "기타"}]
                      </span>
                        </td>
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