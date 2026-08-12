"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getQuestions } from "@/lib/questions";

import styles from "./page.module.css";

const CATEGORIES = ["전체", "개발", "멘토링", "취업", "기타"];

export default function QuestionsPage() {
  const router = useRouter();

  const [page, setPage] = useState(0);
  const [category, setCategory] = useState("전체");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // 🔍 검색어 및 정렬 옵션
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("latest"); // "latest" | "oldest" | "mostAnswers"

  useEffect(() => {
    let ignore = false;

    async function loadQuestions() {
      setLoading(true);
      setErrorMessage("");

      try {
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
  }, [page, category]);

  const handleCategoryChange = (newCategory) => {
    if (category !== newCategory) {
      setCategory(newCategory);
      setPage(0);
    }
  };

  const rawQuestions = data?.content ?? [];

  // 🔍 질문 목록 검색 및 정렬 필터링
  const filteredQuestions = useMemo(() => {
    let list = [...rawQuestions];

    // 검색어 필터링 (제목 및 작성자)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          item.title?.toLowerCase().includes(q) ||
          (item.authorName || item.name || "").toLowerCase().includes(q)
      );
    }

    // 정렬
    list.sort((a, b) => {
      if (sortOption === "latest") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortOption === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortOption === "mostAnswers") return (b.answerCount ?? 0) - (a.answerCount ?? 0);
      return 0;
    });

    return list;
  }, [rawQuestions, searchQuery, sortOption]);

  const totalElements = data?.totalElements ?? 0;
  const totalPages = Math.max(Math.ceil(totalElements / 10), 1);

  const handleAskClick = () => {
<<<<<<< HEAD
    const isLoggedIn = Boolean(localStorage.getItem("accessToken"));
=======
    const isLoggedIn = Boolean(localStorage.getItem("accessToken") || localStorage.getItem("token"));
>>>>>>> main

    if (!isLoggedIn) {
      alert("질문 등록은 로그인 후 이용 가능합니다.");
      router.push("/login");
      return;
    }

    router.push("/questions/new");
  };

  return (
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
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
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

        {/* 🔍 검색창 & 정렬 드롭다운 바 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            marginBottom: "20px",
            flexWrap: "wrap",
          }}
        >
          <input
            type="text"
            placeholder="질문 제목 또는 작성자 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: "8px 14px",
              borderRadius: "6px",
              border: "1px solid #e5e7eb",
              fontSize: "14px",
              width: "280px",
            }}
          />

          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #e5e7eb",
              fontSize: "14px",
              backgroundColor: "#ffffff",
              cursor: "pointer",
            }}
          >
            <option value="latest">최신순</option>
            <option value="oldest">오래된순</option>
            <option value="mostAnswers">답변 많은순</option>
          </select>
        </div>

        {loading && <p className={styles.statusText}>불러오는 중...</p>}

        {!loading && errorMessage && (
          <p className={styles.errorMessage}>{errorMessage}</p>
        )}

        {!loading && !errorMessage && filteredQuestions.length === 0 && (
          <p className={styles.statusText}>
            {searchQuery ? "검색 결과가 없습니다." : "아직 등록된 질문이 없습니다."}
          </p>
        )}

        {!loading && !errorMessage && filteredQuestions.length > 0 && (
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: "70px", textAlign: "center" }}>분류</th>
                <th style={{ width: "auto" }}>질문 제목</th>
                <th style={{ width: "120px" }}>작성자</th>
                <th style={{ width: "80px", textAlign: "center" }}>답변수</th>
                <th style={{ width: "110px", textAlign: "center" }}>등록일</th>
              </tr>
            </thead>

            <tbody>
              {filteredQuestions.map((question) => (
                <tr key={question.id}>
                  <td style={{ textAlign: "center" }}>
                    <span style={{ color: "#2867e8", fontSize: "13px", fontWeight: "bold" }}>
                      [{question.category || "기타"}]
                    </span>
                  </td>
                  <td className={styles.titleCell}>
                    <Link href={`/questions/${question.id}`}>
                      {question.title}
                    </Link>
                  </td>
                  <td>{question.authorName || question.name || "익명"}</td>
                  <td style={{ textAlign: "center" }}>
                    <span className={styles.answerCount}>
                      {question.answerCount ?? 0}개
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>{formatDate(question.createdAt)}</td>
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

<<<<<<< HEAD
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
=======
            {!loading && !errorMessage && questions.length === 0 && (
                <p className={styles.statusText}>아직 등록된 질문이 없습니다.</p>
            )}

            {!loading && !errorMessage && questions.length > 0 && (
                <table className={styles.table}>
                  <thead>
                  <tr>
                    <th style={{ width: "80px", textAlign: "center" }}>분류</th>
                    <th>질문 제목</th>
                    <th>작성자</th>
                    <th>답변수</th>
                    <th>좋아요</th> {/* 🌟 좋아요 컬럼 추가 */}
                    <th>등록일</th>
                  </tr>
                  </thead>

                  <tbody>
                  {questions.map((question) => (
                      <tr key={question.id}>
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
                        <td>
                          {/* 🌟 좋아요 개수 뱃지 추가 */}
                          <span className={styles.likeCountBadge}>
                            ❤️ {question.likeCount ?? 0}
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
>>>>>>> main
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