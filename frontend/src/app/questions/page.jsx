"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// 💡 팀원의 getQuestions와 우리가 만든 getFollowingQuestions를 함께 임포트
import { getQuestions, getFollowingQuestions } from "@/lib/questions";

import styles from "./page.module.css";

// 💡 팀원 코드에 우리가 만든 '팔로잉' 카테고리 추가
const CATEGORIES = ["전체", "팔로잉", "개발", "멘토링", "취업", "기타"];

export default function QuestionsPage() {
  const router = useRouter();

  const [page, setPage] = useState(0);
  const [category, setCategory] = useState("전체");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // 🔍 검색어 및 정렬 옵션 상태 (팀원 코드 유지)
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("latest");

  useEffect(() => {
    let ignore = false;

    async function loadQuestions() {
      setLoading(true);
      setErrorMessage("");

      try {
        let result;

        // 💡 팔로잉 탭 로직 (우리 코드) + 서버 검색/정렬 파라미터 (팀원 코드) 병합
        if (category === "팔로잉") {
          result = await getFollowingQuestions({
            page,
            size: 10,
            keyword: searchQuery,
            sort: sortOption
          });
        } else {
          const categoryParam = category === "전체" ? "" : category;
          // 서버로 검색어(keyword)와 정렬(sort) 조건 전달 (팀원 코드)
          result = await getQuestions({
            page,
            size: 10,
            category: categoryParam,
            keyword: searchQuery,
            sort: sortOption
          });
        }

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
  }, [page, category, searchQuery, sortOption]); // 👈 팀원 코드: 검색어나 정렬 변경 시 서버에서 다시 조회

  const handleCategoryChange = (newCategory) => {
    // 💡 팔로잉 탭 클릭 시 로그인 여부 체크 (우리 코드)
    if (newCategory === "팔로잉") {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
      if (!token) {
        alert("팔로우한 사람의 글을 보려면 로그인이 필요합니다.");
        router.push("/login");
        return;
      }
    }

    if (category !== newCategory) {
      setCategory(newCategory);
      setPage(0);
    }
  };

  // 💡 검색어 변경 시 페이지 초기화 (팀원 코드)
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPage(0);
  };

  // 💡 정렬 변경 시 페이지 초기화 (팀원 코드)
  const handleSortChange = (e) => {
    setSortOption(e.target.value);
    setPage(0);
  };

  // 💡 팀원 로직: 클라이언트 사이드 필터링(useMemo) 대신 서버 데이터를 그대로 사용
  const questions = data?.content ?? [];
  const totalElements = data?.totalElements ?? 0;
  const totalPages = Math.max(Math.ceil(totalElements / 10), 1);

  const handleAskClick = () => {
    const isLoggedIn = Boolean(
        localStorage.getItem("accessToken") || localStorage.getItem("token")
    );

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
                placeholder="질문 제목 또는 내용 검색..."
                value={searchQuery}
                onChange={handleSearchChange}
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
                onChange={handleSortChange}
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
              <option value="mostLikes">좋아요 많은순</option>
            </select>
          </div>

          {loading && <p className={styles.statusText}>불러오는 중...</p>}

          {!loading && errorMessage && (
              <p className={styles.errorMessage}>{errorMessage}</p>
          )}

          {!loading && !errorMessage && questions.length === 0 && (
              <p className={styles.statusText}>
                {searchQuery ? "검색 결과가 없습니다." : "아직 등록된 질문이 없습니다."}
              </p>
          )}

          {!loading && !errorMessage && questions.length > 0 && (
              <table className={styles.table}>
                <thead>
                <tr>
                  <th style={{ width: "70px", textAlign: "center" }}>분류</th>
                  <th style={{ width: "auto" }}>질문 제목</th>
                  <th style={{ width: "110px" }}>작성자</th>
                  <th style={{ width: "70px", textAlign: "center" }}>답변수</th>
                  <th style={{ width: "80px", textAlign: "center" }}>좋아요</th>
                  <th style={{ width: "100px", textAlign: "center" }}>등록일</th>
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
                      <td className={styles.titleCell}>
                        <Link href={`/questions/${question.id}`}>
                          {question.title}
                        </Link>
                      </td>
                      <td>
                        <Link
                            href={`/users/${question.userId}?name=${encodeURIComponent(question.authorName || question.name || "익명")}`}
                            style={{ color: "#111827", textDecoration: "none", transition: "color 0.2s" }}
                            onMouseOver={(e) => e.target.style.color = "#2867e8"}
                            onMouseOut={(e) => e.target.style.color = "#111827"}
                        >
                          {question.authorName || question.name || "익명"}
                        </Link>
                      </td>
                      <td style={{ textAlign: "center" }}>
                    <span className={styles.answerCount}>
                      {question.answerCount ?? 0}개
                    </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                    <span className={styles.likeCountBadge}>
                      ❤️ {question.likeCount ?? 0}
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