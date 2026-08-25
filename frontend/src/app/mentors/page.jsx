"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { getMentors } from "@/lib/mentors";
import styles from "./page.module.css";
import {
  CATEGORY_FILTER_OPTIONS,
  CAREER_FILTER_OPTIONS,
  MENTOR_CATEGORIES,
  splitTags,
  careerCodeOf,
} from "@/constants/mentorOptions";

const PAGE_SIZE = 16;
const DAYS_OF_WEEK = ["일", "월", "화", "수", "목", "금", "토"];

// 목록은 constants/mentorOptions.js 한 곳에서만 관리한다.
// 멘토 정보 입력 폼(MentorInfoCard)도 같은 파일을 보므로 값이 어긋날 일이 없다.
const CATEGORY_OPTIONS = CATEGORY_FILTER_OPTIONS;
const CAREER_OPTIONS = CAREER_FILTER_OPTIONS;

const STATUS_OPTIONS = ["전체", "상담 가능", "오프라인"];

// 상세 페이지와 동일한 스케줄 파서
function parseScheduleMap(scheduleStr = "") {
  const scheduleMap = {};
  DAYS_OF_WEEK.forEach(day => {
    scheduleMap[day] = { enabled: false, startTime: "10:00", endTime: "17:00" };
  });

  if (!scheduleStr || scheduleStr === "상담 시간 미설정") return scheduleMap;

  const entries = scheduleStr.split(",").map(s => s.trim());
  entries.forEach(entry => {
    const dayMatch = entry.match(/([월화수목금토일])/);
    const timeMatch = entry.match(/\(([^)]+)\)/);
    
    if (dayMatch && timeMatch) {
      const day = dayMatch[1];
      const [start, end] = timeMatch[1].split("-").map(t => t.trim());
      scheduleMap[day] = { enabled: true, startTime: start, endTime: end };
    }
  });
  return scheduleMap;
}

// 오늘 요일/시간 기준 현재 상담 가능 여부 판별
function checkIsAvailable(scheduleStr) {
  if (!scheduleStr) return false;
  const now = new Date();
  const dayIndex = now.getDay();
  const todayStr = DAYS_OF_WEEK[dayIndex];

  const scheduleMap = parseScheduleMap(scheduleStr);
  const todayInfo = scheduleMap[todayStr];

  if (!todayInfo || !todayInfo.enabled) return false;

  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [startH, startM] = todayInfo.startTime.split(":").map(Number);
  const [endH, endM] = todayInfo.endTime.split(":").map(Number);
  
  return currentTime >= (startH * 60 + startM) && currentTime <= (endH * 60 + endM);
}

function parseTags(tags) {
  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag).trim()).filter(Boolean);
  }
  if (!tags) return [];
  return String(tags)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}


// 드롭다운에서 고른 값("주니어 (3~7년)")이면 그대로, 예전에 자유 입력한 "3년" 같은 값이면
// 숫자를 뽑아 구간으로 판정한다. careerCodeOf가 두 경우를 모두 처리한다.
function matchesCareer(mentor, career) {
  if (career === "전체") return true;
  return careerCodeOf(mentor?.career) === career;
}

function matchesCategory(mentor, category) {
  if (category === "전체") return true;

  // 체크박스로 고른 분야는 tags에 정확히 저장되므로 이걸 우선 본다.
  const tagList = splitTags(mentor?.tags);
  if (tagList.length > 0) {
    if (category === "기타") {
      // 정식 분야를 하나도 안 고르고 자유 키워드만 있는 경우까지 '기타'로 본다.
      return (
        tagList.includes("기타") ||
        !tagList.some((tag) => MENTOR_CATEGORIES.includes(tag))
      );
    }
    return tagList.includes(category);
  }

  // 분야를 아직 안 고른 예전 멘토는 소개/현직 텍스트로 느슨하게 판정한다.
  const searchableText = [mentor?.bio, mentor?.company]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (category === "기타") {
    return !MENTOR_CATEGORIES.slice(0, -1).some((item) =>
      searchableText.includes(item.toLowerCase())
    );
  }

  return searchableText.includes(category.toLowerCase());
}

function isConsultationAvailable(mentor) {
  if (typeof mentor?.consultationAvailable === "boolean") {
    return mentor.consultationAvailable;
  }
  if (typeof mentor?.isAvailable === "boolean") {
    return mentor.isAvailable;
  }
  if (typeof mentor?.available === "boolean") {
    return mentor.available;
  }
  return checkIsAvailable(mentor?.schedule);
}

// '상담 가능' 시간대 여부에 따라 상호 배타적으로 필터링
function matchesStatus(mentor, status) {
  if (status === "전체") return true;
  
  const isAvailableNow = isConsultationAvailable(mentor);

  if (status === "상담 가능") {
    return isAvailableNow; // 현재 상담 가능 시간인 사람
  }
  if (status === "오프라인") {
    return !isAvailableNow; // 현재 상담 가능 시간이 아닌 사람 (상담 가능 시간 외)
  }
  return true;
}

function getRating(mentor) {
  const rating = Number(mentor?.rating);
  return Number.isFinite(rating) ? rating : 0;
}

function getReviewCount(mentor) {
  const count = Number(mentor?.reviewCount);
  return Number.isFinite(count) ? count : 0;
}

function getSubscriberCount(mentor) {
  const count = Number(mentor?.subscriberCount ?? mentor?.subscribersCount ?? 0);
  return Number.isFinite(count) ? count : 0;
}

function getCreatedTime(mentor) {
  const value =
    mentor?.createdAt ||
    mentor?.registeredAt ||
    mentor?.updatedAt ||
    0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function getRecommendScore(mentor) {
  return getRating(mentor) * 100 + getReviewCount(mentor);
}

function sortMentors(list, sort) {
  return [...list].sort((a, b) => {
    if (sort === "rating") {
      return (
        getRating(b) - getRating(a) ||
        getReviewCount(b) - getReviewCount(a)
      );
    }
    if (sort === "latest") {
      return getCreatedTime(b) - getCreatedTime(a);
    }
    return (
      getRecommendScore(b) - getRecommendScore(a) ||
      getRating(b) - getRating(a) ||
      getReviewCount(b) - getReviewCount(a)
    );
  });
}

export default function MentorListPage() {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [keyword, setKeyword] = useState("");

  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [selectedCareer, setSelectedCareer] = useState("전체");
  const [selectedStatus, setSelectedStatus] = useState("전체");

  const [appliedCategory, setAppliedCategory] = useState("전체");
  const [appliedCareer, setAppliedCareer] = useState("전체");
  const [appliedStatus, setAppliedStatus] = useState("전체");

  const [sort, setSort] = useState("recommend");

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const loadMentors = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const data = await getMentors({
        page,
        size: PAGE_SIZE,
        keyword: keyword.trim(),
      });

      setMentors(Array.isArray(data?.content) ? data.content : []);
      setTotalPages(Math.max(1, Number(data?.totalPages) || 1));
      setTotalElements(Number(data?.totalElements) || 0);
    } catch (error) {
      console.error("멘토 목록 조회 실패:", error);
      setMentors([]);
      setTotalPages(1);
      setTotalElements(0);
      setErrorMessage(
        "멘토 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요."
      );
    } finally {
      setLoading(false);
    }
  }, [page, keyword]);

  useEffect(() => {
    loadMentors();
  }, [loadMentors]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setPage(0);
    setKeyword(searchInput.trim());
  };

  const handleApplyFilter = () => {
    setAppliedCategory(selectedCategory);
    setAppliedCareer(selectedCareer);
    setAppliedStatus(selectedStatus);
    setPage(0);
  };

  const handleResetFilter = () => {
    setSearchInput("");
    setKeyword("");
    setSelectedCategory("전체");
    setSelectedCareer("전체");
    setSelectedStatus("전체");
    setAppliedCategory("전체");
    setAppliedCareer("전체");
    setAppliedStatus("전체");
    setSort("recommend");
    setPage(0);
  };

  const visibleMentors = useMemo(() => {
    const filtered = mentors.filter(
      (mentor) =>
        matchesCategory(mentor, appliedCategory) &&
        matchesCareer(mentor, appliedCareer) &&
        matchesStatus(mentor, appliedStatus)
    );
    return sortMentors(filtered, sort);
  }, [mentors, appliedCategory, appliedCareer, appliedStatus, sort]);

  const hasClientFilter =
    appliedCategory !== "전체" ||
    appliedCareer !== "전체" ||
    appliedStatus !== "전체";

  const displayedCount = hasClientFilter ? visibleMentors.length : totalElements;
  const totalPageCount = Math.max(1, totalPages);

  const pageNumbers = useMemo(() => {
    const maxButtons = 5;
    const start = Math.max(0, Math.min(page - 2, totalPageCount - maxButtons));
    const end = Math.min(totalPageCount, start + maxButtons);
    return Array.from({ length: end - start }, (_, index) => start + index);
  }, [page, totalPageCount]);

  return (
    <main className={styles.container}>
      <header className={styles.topHeader}>
        <div className={styles.headingBlock}>
          <h1 className={styles.title}>멘토 목록</h1>
          <p className={styles.subtitle}>다양한 분야의 전문가 멘토들을 만나보세요</p>
        </div>

        <form onSubmit={handleSearchSubmit} className={styles.searchBox} role="search">
          <span className={styles.searchIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="6.5" />
              <path d="m16 16 4 4" />
            </svg>
          </span>
          <input
            type="search"
            placeholder="멘토 이름, 전문 분야 검색..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            aria-label="멘토 검색"
          />
          {searchInput && (
            <button type="button" className={styles.clearSearch} onClick={() => setSearchInput("")} aria-label="검색어 지우기">
              ×
            </button>
          )}
        </form>
      </header>

      <div className={styles.contentLayout}>
        <aside className={styles.sidebar} aria-label="멘토 필터">
          <div className={styles.filterHeader}>
            <span>필터</span>
            <button type="button" onClick={handleResetFilter} className={styles.resetBtn}>
              <span aria-hidden="true">↻</span> 초기화
            </button>
          </div>

          <div className={styles.filterGroup}>
            <div className={styles.groupTitle}>전문 분야</div>
            {CATEGORY_OPTIONS.map((category) => (
              <label key={category} className={styles.checkboxLabel}>
                <input
                  type="radio"
                  name="category"
                  checked={selectedCategory === category}
                  onChange={() => setSelectedCategory(category)}
                />
                <span>{category}</span>
              </label>
            ))}
          </div>

          <div className={styles.filterGroup}>
            <div className={styles.groupTitle}>경력 수준</div>
            {CAREER_OPTIONS.map((item) => (
              <label key={item.value} className={styles.checkboxLabel}>
                <input
                  type="radio"
                  name="career"
                  checked={selectedCareer === item.value}
                  onChange={() => setSelectedCareer(item.value)}
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>

          <div className={styles.filterGroup}>
            <div className={styles.groupTitle}>상담 상태</div>
            {STATUS_OPTIONS.map((status) => (
              <label key={status} className={styles.checkboxLabel}>
                <input
                  type="radio"
                  name="status"
                  checked={selectedStatus === status}
                  onChange={() => setSelectedStatus(status)}
                />
                <span>{status}</span>
              </label>
            ))}
          </div>

          <button type="button" onClick={handleApplyFilter} className={styles.applyBtn}>
            필터 적용하기
          </button>
        </aside>

        <section className={styles.mainContent}>
          <div className={styles.listHeader}>
            <div className={styles.totalCount}>
              전체 <strong>{displayedCount}명</strong>의 멘토
            </div>
            <select value={sort} onChange={(event) => setSort(event.target.value)} className={styles.sortSelect} aria-label="멘토 정렬">
              <option value="recommend">추천순</option>
              <option value="rating">평점순</option>
              <option value="latest">최신순</option>
            </select>
          </div>

          {errorMessage ? (
            <div className={styles.messageState}>
              <p>{errorMessage}</p>
              <button type="button" onClick={loadMentors} className={styles.retryBtn}>
                다시 불러오기
              </button>
            </div>
          ) : loading ? (
            <div className={styles.mentorGrid}>
              {Array.from({ length: PAGE_SIZE }, (_, index) => (
                <div key={index} className={styles.skeletonCard} aria-hidden="true">
                  <div className={styles.skeletonTop}>
                    <span className={styles.skeletonAvatar} />
                    <span className={styles.skeletonBadge} />
                  </div>
                  <span className={styles.skeletonLineWide} />
                  <span className={styles.skeletonLine} />
                  <div className={styles.skeletonTags}>
                    <span />
                    <span />
                    <span />
                  </div>
                  <span className={styles.skeletonFooter} />
                </div>
              ))}
            </div>
          ) : visibleMentors.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>?</div>
              <strong>조회된 멘토가 없습니다.</strong>
              <p>검색어나 필터 조건을 변경해보세요.</p>
            </div>
          ) : (
            <div className={styles.mentorGrid}>
              {visibleMentors.map((mentor) => {
                const tags = parseTags(mentor.tags).slice(0, 4);
                const rating = getRating(mentor);
                const reviewCount = getReviewCount(mentor);
                const subscriberCount = getSubscriberCount(mentor);
                const availableNow = checkIsAvailable(mentor.schedule);

                return (
                  <Link key={mentor.mentorId} href={`/mentors/${mentor.mentorId}`} className={styles.mentorCard}>
                    <div className={styles.cardHeader}>
                      <div className={styles.avatarWrapper}>
                        {mentor.profileImageUrl ? (
                          <img
                            src={mentor.profileImageUrl}
                            alt={`${mentor.name || "멘토"} 프로필`}
                            className={styles.avatar}
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />
                        ) : null}

                        <div className={styles.avatarFallback}>
                          {mentor.name ? mentor.name.charAt(0) : "멘"}
                        </div>

                        <span
                          className={styles.onlineBadge}
                          style={{ backgroundColor: availableNow ? "#22c55e" : "#94a3b8" }}
                          title={availableNow ? "현재 상담 가능" : "상담 시간 아님"}
                          aria-label="상담 상태"
                        />
                      </div>

                      <span className={styles.mentorBadge}>MENTOR</span>
                    </div>

                    <h2 className={styles.mentorName}>{mentor.name || "이름 없음"}</h2>
                    <p className={styles.mentorBio}>{mentor.bio || "소개글이 없습니다."}</p>

                    <div className={styles.tagList}>
                      {tags.length > 0 ? (
                        tags.map((tag, index) => (
                          <span key={`${tag}-${index}`} className={styles.tag}>
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className={styles.noTag}>전문 분야 미등록</span>
                      )}
                    </div>

                    <div className={styles.cardFooter}>
                      <div className={styles.ratingInfo}>
                        <span className={styles.star} aria-hidden="true">★</span>
                        <span className={styles.rating}>{rating.toFixed(1)}</span>
                        <span className={styles.reviewCount}>({reviewCount})</span>
                      </div>

                      <div className={styles.chatInfo} title="구독자 수">
                        <span className={styles.chatIcon} aria-hidden="true">👤</span>
                        <span>{subscriberCount}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {!errorMessage && !loading && totalPageCount > 1 && (
            <nav className={styles.pagination} aria-label="페이지 이동">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(0, current - 1))}
                disabled={page === 0}
                className={styles.pageArrow}
                aria-label="이전 페이지"
              >
                ‹
              </button>

              {pageNumbers.map((pageNumber) => (
                <button
                  type="button"
                  key={pageNumber}
                  onClick={() => setPage(pageNumber)}
                  className={`${styles.pageBtn} ${page === pageNumber ? styles.activePage : ""}`}
                  aria-current={page === pageNumber ? "page" : undefined}
                >
                  {pageNumber + 1}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPageCount - 1, current + 1))}
                disabled={page === totalPageCount - 1}
                className={styles.pageArrow}
                aria-label="다음 페이지"
              >
                ›
              </button>
            </nav>
          )}
        </section>
      </div>
    </main>
  );
}