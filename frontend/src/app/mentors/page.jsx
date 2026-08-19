"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { FaUserLarge } from "react-icons/fa6";
import { getMentors } from "@/lib/mentors";
import styles from "./page.module.css";

const PAGE_SIZE = 16;

// 인라인 SVG 데이터 URI — 정적 파일(/default-avatar.png)에 의존하지 않아 404가 날 수 없다.
const DEFAULT_AVATAR = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="50" fill="#e5e7eb" />
  <circle cx="50" cy="38" r="18" fill="#9ca3af" />
  <path d="M50 62c-19 0-34 12-34 27v6a5 5 0 0 0 5 5h58a5 5 0 0 0 5-5v-6c0-15-15-27-34-27z" fill="#9ca3af" />
</svg>`)}`;

const CATEGORY_OPTIONS = [
  "전체",
  "개발",
  "데이터 사이언스",
  "디자인",
  "마케팅",
  "커리어",
  "창업",
  "기타",
];

const CAREER_OPTIONS = [
  { label: "전체", value: "전체" },
  { label: "신입 (1~3년)", value: "JUNIOR" },
  { label: "주니어 (3~7년)", value: "MID" },
  { label: "시니어 (7~15년)", value: "SENIOR" },
  { label: "전문가 (15년+)", value: "EXPERT" },
];

const STATUS_OPTIONS = ["전체", "활동 중", "상담 가능"];

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

function getCareerYears(mentor) {
  const source = [
    mentor?.career,
    mentor?.careerYears,
    mentor?.experience,
    mentor?.experienceYears,
  ]
    .filter((value) => value !== null && value !== undefined)
    .join(" ");

  const matches = String(source).match(/\d+(?:\.\d+)?/g);
  if (!matches?.length) return null;

  return Number(matches[0]);
}

function matchesCareer(mentor, career) {
  if (career === "전체") return true;

  const years = getCareerYears(mentor);
  if (years === null) return false;

  if (career === "JUNIOR") return years >= 1 && years < 3;
  if (career === "MID") return years >= 3 && years < 7;
  if (career === "SENIOR") return years >= 7 && years < 15;
  if (career === "EXPERT") return years >= 15;

  return true;
}

function matchesCategory(mentor, category) {
  if (category === "전체") return true;

  const searchableText = [
    mentor?.tags,
    mentor?.category,
    mentor?.specialty,
    mentor?.field,
    mentor?.bio,
    mentor?.company,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (category === "기타") {
    return !CATEGORY_OPTIONS.slice(1, -1).some((item) =>
      searchableText.includes(item.toLowerCase())
    );
  }

  return searchableText.includes(category.toLowerCase());
}

function isMentorActive(mentor) {
  const explicitStatus =
    mentor?.status ??
    mentor?.activityStatus ??
    mentor?.mentorStatus;

  if (typeof mentor?.isActive === "boolean") return mentor.isActive;
  if (typeof mentor?.active === "boolean") return mentor.active;

  if (typeof explicitStatus === "string") {
    return ["ACTIVE", "활동 중", "active", "AVAILABLE"].includes(
      explicitStatus
    );
  }

  return true;
}

// 상담 가능 시간 판별 로직
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

  const schedule = String(mentor?.schedule || "").trim().toLowerCase();
  if (!schedule) return false;

  const now = new Date();
  const dayIndex = now.getDay();
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  const currentDayStr = dayNames[dayIndex];

  const hasWeekend = schedule.includes("토") || schedule.includes("일") || schedule.includes("주말");
  const hasWeekday = schedule.includes("월") || schedule.includes("화") || schedule.includes("수") || schedule.includes("목") || schedule.includes("금") || schedule.includes("평일");

  if ((currentDayStr === "토" || currentDayStr === "일") && !hasWeekend && hasWeekday) {
    return false;
  }
  if (currentDayStr !== "토" && currentDayStr !== "일" && hasWeekend && !hasWeekday) {
    return false;
  }

  const containsSpecificDay = ["월", "화", "수", "목", "금", "토", "일"].some(d => schedule.includes(d));
  if (containsSpecificDay && !schedule.includes(currentDayStr)) {
    return false;
  }

  return true;
}

function matchesStatus(mentor, status) {
  if (status === "전체") return true;
  if (status === "활동 중") return isMentorActive(mentor);
  if (status === "상담 가능") return isConsultationAvailable(mentor);
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
  const count = Number(mentor?.subscriberCount);
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

function sortMentors(list, sort) {
  return [...list].sort((a, b) => {
    // 1. 평점순: 평점 내림차순, 리뷰 수 내림차순
    if (sort === "rating") {
      return (
        getRating(b) - getRating(a) ||
        getReviewCount(b) - getReviewCount(a)
      );
    }

    // 2. 최신순: 최신 게시글(작성일) 기준 내림차순
    if (sort === "latest") {
      return getCreatedTime(b) - getCreatedTime(a);
    }

    // 3. 추천순: 구독자수 내림차순 (같을 경우 평점/리뷰수 순)
    return (
      getSubscriberCount(b) - getSubscriberCount(a) ||
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

      // 에러의 원인이 되었던 부분을 빈 배열([])로 수정했습니다.
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
  }, [
    mentors,
    appliedCategory,
    appliedCareer,
    appliedStatus,
    sort,
  ]);

  const hasClientFilter =
    appliedCategory !== "전체" ||
    appliedCareer !== "전체" ||
    appliedStatus !== "전체";

  const displayedCount = hasClientFilter
    ? visibleMentors.length
    : totalElements;

  const totalPageCount = Math.max(1, totalPages);

  const pageNumbers = useMemo(() => {
    const maxButtons = 5;
    const start = Math.max(
      0,
      Math.min(
        page - 2,
        totalPageCount - maxButtons
      )
    );

    const end = Math.min(
      totalPageCount,
      start + maxButtons
    );

    return Array.from(
      { length: end - start },
      (_, index) => start + index
    );
  }, [page, totalPageCount]);

  return (
    <main className={styles.container}>
      <header className={styles.topHeader}>
        <div className={styles.headingBlock}>
          <h1 className={styles.title}>멘토 목록</h1>
          <p className={styles.subtitle}>
            다양한 분야의 전문가 멘토들을 만나보세요
          </p>
        </div>

        <form
          onSubmit={handleSearchSubmit}
          className={styles.searchBox}
          role="search"
        >
          <span
            className={styles.searchIcon}
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="6.5" />
              <path d="m16 16 4 4" />
            </svg>
          </span>

          <input
            type="search"
            placeholder="멘토 이름, 전문 분야 검색..."
            value={searchInput}
            onChange={(event) =>
              setSearchInput(event.target.value)
            }
            aria-label="멘토 검색"
          />

          {searchInput && (
            <button
              type="button"
              className={styles.clearSearch}
              onClick={() => setSearchInput("")}
              aria-label="검색어 지우기"
            >
              ×
            </button>
          )}
        </form>
      </header>

      <div className={styles.contentLayout}>
        <aside
          className={styles.sidebar}
          aria-label="멘토 필터"
        >
          <div className={styles.filterHeader}>
            <span>필터</span>

            <button
              type="button"
              onClick={handleResetFilter}
              className={styles.resetBtn}
            >
              <span aria-hidden="true">↻</span>
              초기화
            </button>
          </div>

          <div className={styles.filterGroup}>
            <div className={styles.groupTitle}>
              전문 분야
            </div>

            {CATEGORY_OPTIONS.map((category) => (
              <label
                key={category}
                className={styles.checkboxLabel}
              >
                <input
                  type="radio"
                  name="category"
                  checked={
                    selectedCategory === category
                  }
                  onChange={() =>
                    setSelectedCategory(category)
                  }
                />
                <span>{category}</span>
              </label>
            ))}
          </div>

          <div className={styles.filterGroup}>
            <div className={styles.groupTitle}>
              경력 수준
            </div>

            {CAREER_OPTIONS.map((item) => (
              <label
                key={item.value}
                className={styles.checkboxLabel}
              >
                <input
                  type="radio"
                  name="career"
                  checked={
                    selectedCareer === item.value
                  }
                  onChange={() =>
                    setSelectedCareer(item.value)
                  }
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>

          <div className={styles.filterGroup}>
            <div className={styles.groupTitle}>
              활동 상태
            </div>

            {STATUS_OPTIONS.map((status) => (
              <label
                key={status}
                className={styles.checkboxLabel}
              >
                <input
                  type="radio"
                  name="status"
                  checked={
                    selectedStatus === status
                  }
                  onChange={() =>
                    setSelectedStatus(status)
                  }
                />
                <span>{status}</span>
              </label>
            ))}
          </div>

          <button
            type="button"
            onClick={handleApplyFilter}
            className={styles.applyBtn}
          >
            필터 적용하기
          </button>
        </aside>

        <section className={styles.mainContent}>
          <div className={styles.listHeader}>
            <div className={styles.totalCount}>
              전체{" "}
              <strong>
                {displayedCount}
                명
              </strong>
              의 멘토
            </div>

            <select
              value={sort}
              onChange={(event) =>
                setSort(event.target.value)
              }
              className={styles.sortSelect}
              aria-label="멘토 정렬"
            >
              <option value="recommend">
                추천순
              </option>
              <option value="rating">
                평점순
              </option>
              <option value="latest">
                최신순
              </option>
            </select>
          </div>

          {errorMessage ? (
            <div className={styles.messageState}>
              <p>{errorMessage}</p>
              <button
                type="button"
                onClick={loadMentors}
                className={styles.retryBtn}
              >
                다시 불러오기
              </button>
            </div>
          ) : loading ? (
            <div className={styles.mentorGrid}>
              {Array.from(
                { length: PAGE_SIZE },
                (_, index) => (
                  <div
                    key={index}
                    className={styles.skeletonCard}
                    aria-hidden="true"
                  >
                    <div
                      className={
                        styles.skeletonTop
                      }
                    >
                      <span
                        className={
                          styles.skeletonAvatar
                        }
                      />
                      <span
                        className={
                          styles.skeletonBadge
                        }
                      />
                    </div>
                    <span
                      className={
                        styles.skeletonLineWide
                      }
                    />
                    <span
                      className={
                        styles.skeletonLine
                      }
                    />
                    <div
                      className={
                        styles.skeletonTags
                      }
                    >
                      <span />
                      <span />
                      <span />
                    </div>
                    <span
                      className={
                        styles.skeletonFooter
                      }
                    />
                  </div>
                )
              )}
            </div>
          ) : visibleMentors.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                ?
              </div>
              <strong>
                조회된 멘토가 없습니다.
              </strong>
              <p>
                검색어나 필터 조건을
                변경해보세요.
              </p>
            </div>
          ) : (
            <div className={styles.mentorGrid}>
              {visibleMentors.map((mentor) => {
                const tags = parseTags(
                  mentor.tags
                ).slice(0, 4);

                const rating = getRating(mentor);
                const reviewCount = getReviewCount(mentor);
                const active = isMentorActive(mentor);

                return (
                  <Link
                    key={mentor.mentorId}
                    href={`/mentors/${mentor.mentorId}`}
                    className={styles.mentorCard}
                  >
                    <div
                      className={
                        styles.cardHeader
                      }
                    >
                      <div
                        className={
                          styles.avatarWrapper
                        }
                      >
                        <img
                          src={
                            mentor.profileImageUrl ||
                            DEFAULT_AVATAR
                          }
                          alt={`${mentor.name || "멘토"} 프로필`}
                          className={
                            styles.avatar
                          }
                          onError={(event) => {
                            const img = event.currentTarget;
                            // 이미 대체 이미지로 바꾼 뒤엔 다시 시도하지 않는다 — 안 그러면
                            // (깨진 URL → onError → 같은 src 재할당 → 재요청 → 다시 onError) 무한 루프에 빠진다.
                            if (img.dataset.fallbackApplied) return;
                            img.dataset.fallbackApplied = "true";
                            img.src = DEFAULT_AVATAR;
                          }}
                        />
                          👤
                        </div>

                        {active && (
                          <span
                            className={`${styles.onlineBadge} ${
                              !consultAvailable ? styles.orangeBadge : ""
                            }`}
                            title={consultAvailable ? "상담 가능" : "상담 가능 시간 아님"}
                            aria-label={consultAvailable ? "상담 가능" : "상담 가능 시간 아님"}
                          />
                        )}
                      </div>

                      <div className={styles.headerBadges}>
                        {consultAvailable && (
                          <span className={styles.consultBadge}>
                            상담가능
                          </span>
                        )}
                        <span
                          className={
                            styles.mentorBadge
                          }
                        >
                          MENTOR
                        </span>
                      </div>
                    </div>

                    <h2
                      className={
                        styles.mentorName
                      }
                    >
                      {mentor.name ||
                        "이름 없음"}
                    </h2>

                    <p
                      className={
                        styles.mentorBio
                      }
                    >
                      {mentor.bio ||
                        "소개글이 없습니다."}
                    </p>

                    <div className={styles.careerInfoText}>
                      경력: {careerText}
                    </div>

                    <div
                      className={
                        styles.tagList
                      }
                    >
                      {tags.length > 0 ? (
                        tags.map(
                          (tag, index) => (
                            <span
                              key={`${tag}-${index}`}
                              className={
                                styles.tag
                              }
                            >
                              {tag}
                            </span>
                          )
                        )
                      ) : (
                        <span
                          className={
                            styles.noTag
                          }
                        >
                          전문 분야 미등록
                        </span>
                      )}
                    </div>

                    <div
                      className={
                        styles.cardFooter
                      }
                    >
                      <div
                        className={
                          styles.ratingInfo
                        }
                      >
                        <span
                          className={
                            styles.star
                          }
                          aria-hidden="true"
                        >
                          ★
                        </span>

                        <span
                          className={
                            styles.rating
                          }
                        >
                          {rating.toFixed(1)}
                        </span>

                        <span
                          className={
                            styles.reviewCount
                          }
                        >
                          ({reviewCount})
                        </span>
                      </div>

                      <div
                        className={
                          styles.subscriberInfo
                        }
                        title="구독자 수"
                      >
                        <span
                          className={
                            styles.subscriberIcon
                          }
                          aria-hidden="true"
                        >
                          ♙
                        </span>
                        <span>
                          {subscriberCount} 구독
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {!errorMessage &&
            !loading &&
            totalPageCount > 1 && (
              <nav
                className={
                  styles.pagination
                }
                aria-label="페이지 이동"
              >
                <button
                  type="button"
                  onClick={() =>
                    setPage((current) =>
                      Math.max(
                        0,
                        current - 1
                      )
                    )
                  }
                  disabled={page === 0}
                  className={
                    styles.pageArrow
                  }
                  aria-label="이전 페이지"
                >
                  ‹
                </button>

                {pageNumbers.map(
                  (pageNumber) => (
                    <button
                      type="button"
                      key={pageNumber}
                      onClick={() =>
                        setPage(pageNumber)
                      }
                      className={`${styles.pageBtn} ${
                        page === pageNumber
                          ? styles.activePage
                          : ""
                      }`}
                      aria-current={
                        page === pageNumber
                          ? "page"
                          : undefined
                      }
                    >
                      {pageNumber + 1}
                    </button>
                  )
                )}

                <button
                  type="button"
                  onClick={() =>
                    setPage((current) =>
                      Math.min(
                        totalPageCount - 1,
                        current + 1
                      )
                    )
                  }
                  disabled={
                    page ===
                    totalPageCount - 1
                  }
                  className={
                    styles.pageArrow
                  }
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
