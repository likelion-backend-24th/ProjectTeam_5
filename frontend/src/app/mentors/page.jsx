"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getMentors } from "@/lib/mentors"; // 💡 모듈 불러오기
import styles from "./page.module.css";

export default function MentorListPage() {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 검색 및 필터 상태
  const [searchInput, setSearchInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [selectedCareer, setSelectedCareer] = useState("전체");
  const [selectedStatus, setSelectedStatus] = useState("전체");
  const [sort, setSort] = useState("recommend");
  
  // 페이징 상태
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // 멘토 목록 불러오기 (fetch 직호출 제거)
  const loadMentors = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMentors({ page, size: 8, keyword });
      setMentors(data.content || []);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || 0);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [page, keyword]);

  useEffect(() => {
    loadMentors();
  }, [loadMentors]);

  // 검색어 제출
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    setKeyword(searchInput);
  };

  // 필터 초기화
  const handleResetFilter = () => {
    setSearchInput("");
    setKeyword("");
    setSelectedCategory("전체");
    setSelectedCareer("전체");
    setSelectedStatus("전체");
    setPage(0);
  };

  const parseTags = (tagsStr) => {
    if (!tagsStr) return [];
    return tagsStr.split(",").map((t) => t.trim()).filter(Boolean);
  };

  return (
    <div className={styles.container}>
      {/* 상단 타이틀 & 검색바 */}
      <header className={styles.topHeader}>
        <div>
          <h1 className={styles.title}>멘토 목록</h1>
          <p className={styles.subtitle}>다양한 분야의 전문가 멘토들을 만나보세요</p>
        </div>
        <form onSubmit={handleSearchSubmit} className={styles.searchBox}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="멘토 이름, 전문 분야 검색..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </form>
      </header>

      <div className={styles.contentLayout}>
        {/* 좌측 필터 사이드바 */}
        <aside className={styles.sidebar}>
          <div className={styles.filterHeader}>
            <span>필터</span>
            <button type="button" onClick={handleResetFilter} className={styles.resetBtn}>
              🔄 초기화
            </button>
          </div>

          <div className={styles.filterGroup}>
            <div className={styles.groupTitle}>전문 분야</div>
            {["전체", "개발", "데이터 사이언스", "디자인", "마케팅", "커리어", "창업", "기타"].map((cat) => (
              <label key={cat} className={styles.checkboxLabel}>
                <input
                  type="radio"
                  name="category"
                  checked={selectedCategory === cat}
                  onChange={() => setSelectedCategory(cat)}
                />
                {cat}
              </label>
            ))}
          </div>

          <div className={styles.filterGroup}>
            <div className={styles.groupTitle}>경력 수준</div>
            {[
              { label: "전체", value: "전체" },
              { label: "신입 (1~3년)", value: "JUNIOR" },
              { label: "주니어 (3~7년)", value: "MID" },
              { label: "시니어 (7~15년)", value: "SENIOR" },
              { label: "전문가 (15년+)", value: "EXPERT" },
            ].map((item) => (
              <label key={item.value} className={styles.checkboxLabel}>
                <input
                  type="radio"
                  name="career"
                  checked={selectedCareer === item.value}
                  onChange={() => setSelectedCareer(item.value)}
                />
                {item.label}
              </label>
            ))}
          </div>

          <div className={styles.filterGroup}>
            <div className={styles.groupTitle}>활동 상태</div>
            {["전체", "활동 중", "상담 가능"].map((status) => (
              <label key={status} className={styles.checkboxLabel}>
                <input
                  type="radio"
                  name="status"
                  checked={selectedStatus === status}
                  onChange={() => setSelectedStatus(status)}
                />
                {status}
              </label>
            ))}
          </div>

          <button type="button" onClick={loadMentors} className={styles.applyBtn}>
            적용하기
          </button>
        </aside>

        {/* 메인 콘텐츠 영역 */}
        <section className={styles.mainContent}>
          <div className={styles.listHeader}>
            <div className={styles.totalCount}>
              전체 <strong>{totalElements}명</strong>의 멘토
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className={styles.sortSelect}
            >
              <option value="recommend">추천순</option>
              <option value="rating">평점순</option>
              <option value="latest">최신순</option>
            </select>
          </div>

          {loading ? (
            <div className={styles.loadingState}>멘토 목록을 불러오는 중입니다...</div>
          ) : mentors.length === 0 ? (
            <div className={styles.emptyState}>조회된 멘토가 없습니다.</div>
          ) : (
            <div className={styles.mentorGrid}>
              {mentors.map((mentor) => (
                <Link
                  key={mentor.mentorId}
                  href={`/mentors/${mentor.mentorId}`}
                  className={styles.mentorCard}
                >
                  <div className={styles.cardHeader}>
                    <div className={styles.avatarWrapper}>
                      <img
                        src={mentor.profileImageUrl || "/default-avatar.png"}
                        alt={mentor.name}
                        className={styles.avatar}
                      />
                      <span className={styles.onlineBadge}></span>
                    </div>
                    <span className={styles.mentorBadge}>MENTOR</span>
                  </div>

                  <h3 className={styles.mentorName}>{mentor.name}</h3>
                  <p className={styles.mentorBio}>{mentor.bio || "소개글이 없습니다."}</p>

                  <div className={styles.tagList}>
                    {parseTags(mentor.tags).map((tag, idx) => (
                      <span key={idx} className={styles.tag}>
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className={styles.cardFooter}>
                    <div className={styles.ratingInfo}>
                      <span className={styles.star}>★</span>
                      <span className={styles.rating}>{mentor.rating ? mentor.rating.toFixed(1) : "0.0"}</span>
                      <span className={styles.reviewCount}>({mentor.reviewCount || 0})</span>
                    </div>
                    <div className={styles.chatInfo}>
                      <span className={styles.chatIcon}>💬</span>
                      <span>{mentor.reviewCount || 0}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className={styles.pageArrow}
              >
                &lt;
              </button>
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setPage(idx)}
                  className={`${styles.pageBtn} ${page === idx ? styles.activePage : ""}`}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className={styles.pageArrow}
              >
                &gt;
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}