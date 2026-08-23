"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/contexts/AuthContext";
import { useToast } from "@/app/contexts/ToastContext";
import {
  getAllUsers,
  searchUsers,
  blockUser,
  unblockUser,
  deleteUserByAdmin,
  getMentorApplications,
  approveMentor,
  rejectMentor,
  getPendingCancellations,
  approveCancellation,
  rejectCancellation,
  getInquiries,
  updateInquiryStatus,
} from "@/lib/admin";
import { getQuestions } from "@/lib/questions";
import { getQuestionsByUser } from "@/lib/users";
import ConfirmDialog from "@/components/modal/ConfirmDialog";

import styles from "./page.module.css";

export default function AdminPage() {
  const router = useRouter();
  const { user, isLoggedIn, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]); // 질문 관리 탭의 작성자 집계용 전체 목록 (그 탭에서만 채워짐)

  // 회원 관리 탭 — 서버 페이지네이션. USERS_PAGE_SIZE만큼씩, 검색/역할/정렬은 서버에 그대로 넘긴다.
  const USERS_PAGE_SIZE = 20;
  const [usersPageData, setUsersPageData] = useState({ content: [], totalPages: 0, totalElements: 0, number: 0 });
  const [usersPageNumber, setUsersPageNumber] = useState(0);
  const [mentorApps, setMentorApps] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("latest");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const [expandedUserId, setExpandedUserId] = useState(null);
  const [userQuestionsMap, setUserQuestionsMap] = useState({});
  const [subLoadingId, setSubLoadingId] = useState(null);

  const [cancellations, setCancellations] = useState([]);

  // confirm()/prompt() 게이트가 이 페이지에만 7군데라, 액션마다 별도 state를 만드는 대신
  // "지금 확인 대기 중인 작업 1개"만 들고 있는 범용 패턴을 쓴다. run()이 실제 API 호출을 담당한다.
  const [pendingAction, setPendingAction] = useState(null);
  const [actionSubmitting, setActionSubmitting] = useState(false);

  const runPendingAction = async (inputValue) => {
    if (!pendingAction) return;
    setActionSubmitting(true);
    try {
      await pendingAction.run(inputValue);
      setPendingAction(null);
    } catch (error) {
      showToast(error.message || "처리에 실패했습니다.", "error");
    } finally {
      setActionSubmitting(false);
    }
  };

  const [inquiries, setInquiries] = useState([]);
  const [selectedInquiry, setSelectedInquiry] = useState(null);

  // "users" 탭은 아래 loadUsersPage()가 검색/정렬/역할 필터와 함께 서버 페이지네이션으로 따로 불러온다 —
  // 예전엔 이 함수가 탭에 상관없이 매번 전체 회원 목록을 통째로 불러오고 있었다(회원 탭이 아닐 때도 낭비).
  const fetchData = useCallback(async () => {
    if (activeTab === "users") return;

    setLoading(true);
    setErrorMessage("");
    try {
      if (activeTab === "mentors") {
        const data = await getMentorApplications();
        setMentorApps(data || []);
      } else if (activeTab === "questions") {
        // 작성자별 집계(authorSummary)가 전체 회원 목록과 대조해야 해서 이 탭에서만 페이지네이션 없이 받는다.
        const usersData = await getAllUsers();
        setUsers(usersData || []);
        const data = await getQuestions({
          page: 0,
          size: 1000,
          category: "전체",
          keyword: "",
          sort: "latest",
        });
        setQuestions(data.content || data || []);
      } else if (activeTab === "refunds") {
        const data = await getPendingCancellations();
        setCancellations(data || []);
      } else if (activeTab === "inquiries") {
        const data = await getInquiries();
        setInquiries(data || []);
      }
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message || "데이터를 불러오는 데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  const loadUsersPage = useCallback(
    async (pageNumber) => {
      setLoading(true);
      setErrorMessage("");
      try {
        const data = await searchUsers({
          page: pageNumber,
          size: USERS_PAGE_SIZE,
          keyword: searchQuery.trim(),
          role: roleFilter,
          sort: sortOption,
        });
        setUsersPageData(data);
      } catch (error) {
        console.error(error);
        setErrorMessage(error.message || "회원 목록을 불러오는 데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    },
    [searchQuery, roleFilter, sortOption]
  );

  // 검색어/역할/정렬이 바뀌면(또는 회원 탭으로 들어오면) 1페이지부터 새로 불러온다.
  // 타이핑 중 매 글자마다 요청을 보내지 않도록 300ms 정도 묶어서 보낸다.
  useEffect(() => {
    if (activeTab !== "users") return;
    const timer = setTimeout(() => {
      setUsersPageNumber(0);
      loadUsersPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [activeTab, searchQuery, roleFilter, sortOption, loadUsersPage]);

  const goToUsersPage = (pageNumber) => {
    setUsersPageNumber(pageNumber);
    loadUsersPage(pageNumber);
  };

  useEffect(() => {
    if (authLoading) return;

    if (!isLoggedIn || user?.role !== "ADMIN") {
      showToast("관리자 권한이 필요합니다.", "error");
      router.push("/questions");
      return;
    }

    fetchData();
  }, [isLoggedIn, user, authLoading, fetchData, router]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchQuery("");
    setSortOption("latest");
    setRoleFilter("ALL");
    setExpandedUserId(null);
    setSelectedInquiry(null);
  };

  const filteredMentorApps = useMemo(() => {
    let list = [...mentorApps];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (app) =>
          (app.name || "").toLowerCase().includes(q) ||
          (app.email || "").toLowerCase().includes(q),
      );
    }

    list.sort((a, b) => {
      const idA = Number(a.id || 0);
      const idB = Number(b.id || 0);
      return sortOption === "latest" ? idB - idA : idA - idB;
    });

    return list;
  }, [mentorApps, searchQuery, sortOption]);

  const filteredInquiries = useMemo(() => {
    let list = [...inquiries];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          (item.title || "").toLowerCase().includes(q) ||
          (item.email || "").toLowerCase().includes(q) ||
          (item.category || "").toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      const idA = Number(a.id || 0);
      const idB = Number(b.id || 0);
      return sortOption === "latest" ? idB - idA : idA - idB;
    });

    return list;
  }, [inquiries, searchQuery, sortOption]);

  const authorSummary = useMemo(() => {
    const map = {};
    const userMapByName = {};
    const userMapById = {};
    users.forEach((u) => {
      if (u.id) userMapById[String(u.id)] = u;
      if (u.name) userMapByName[u.name] = u;
    });

    questions.forEach((q) => {
      const qUserId = q.userId || q.authorId || q.writerId;
      const qUserName = q.writerName || q.authorName || "알 수 없음";

      const matchedUser =
        (qUserId && userMapById[String(qUserId)]) || userMapByName[qUserName];

      const authorId = matchedUser?.id || qUserId || qUserName;
      const authorName = matchedUser?.name || qUserName;
      const authorRole =
        matchedUser?.role || q.writerRole || q.authorRole || q.role || "USER";

      if (!map[authorId]) {
        map[authorId] = {
          id: authorId,
          name: authorName,
          role: authorRole,
          count: 0,
        };
      }
      map[authorId].count += 1;
    });

    let list = Object.values(map);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((item) => item.name.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      if (sortOption === "latest") {
        return b.count - a.count;
      } else {
        return a.count - b.count;
      }
    });

    return list;
  }, [questions, users, searchQuery, sortOption]);

  const handleToggleExpand = async (userId) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      return;
    }

    setExpandedUserId(userId);

    if (userQuestionsMap[userId]) return;

    setSubLoadingId(userId);
    try {
      const res = await getQuestionsByUser(userId);
      let list = res?.content || res || [];

      list.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        if (dateA !== dateB) {
          return dateB - dateA;
        }
        return Number(b.id || 0) - Number(a.id || 0);
      });

      setUserQuestionsMap((prev) => ({ ...prev, [userId]: list }));
    } catch (error) {
      console.error(error);
      showToast("해당 유저의 작성글을 불러오는 데 실패했습니다.", "error");
    } finally {
      setSubLoadingId(null);
    }
  };

  const handleBlockToggle = (userId, isBlocked) => {
    const actionText = isBlocked ? "차단 해제" : "차단";
    setPendingAction({
      title: `회원 ${actionText}`,
      message: `해당 회원을 ${actionText}하시겠습니까?`,
      confirmLabel: actionText,
      danger: !isBlocked,
      run: async () => {
        if (isBlocked) {
          await unblockUser(userId);
        } else {
          await blockUser(userId);
        }
        showToast(`${actionText} 처리되었습니다.`, "success");
        fetchData();
      },
    });
  };

  const handleDeleteUser = (userId, userName) => {
    setPendingAction({
      title: "회원 강제 삭제",
      message: `정말로 회원 '${userName}'(ID: ${userId})을 강제 삭제하시겠습니까?\n이 작업은 복구할 수 없습니다.`,
      confirmLabel: "삭제",
      danger: true,
      run: async () => {
        await deleteUserByAdmin(userId);
        showToast("회원이 삭제되었습니다.", "success");
        fetchData();
      },
    });
  };

  const handleApprove = (userId) => {
    setPendingAction({
      title: "멘토 승인",
      message: "해당 회원을 멘토로 승인하시겠습니까?",
      confirmLabel: "승인",
      run: async () => {
        await approveMentor(userId);
        showToast("멘토 승인이 완료되었습니다.", "success");
        fetchData();
      },
    });
  };

  const handleReject = (userId) => {
    setPendingAction({
      title: "멘토 신청 거절",
      message: "해당 회원의 멘토 신청을 거절하시겠습니까?",
      confirmLabel: "거절",
      danger: true,
      run: async () => {
        await rejectMentor(userId);
        showToast("멘토 신청이 거절되었습니다.", "success");
        fetchData();
      },
    });
  };

  const handleApproveCancellation = (id, paymentId) => {
    setPendingAction({
      title: "환불 승인",
      message: `결제 ${paymentId}의 환불을 승인하시겠습니까?\nPortOne에 실제 취소 요청이 전송되며 되돌릴 수 없습니다.`,
      confirmLabel: "승인",
      danger: true,
      run: async () => {
        await approveCancellation(id);
        showToast("환불이 승인되었습니다.", "success");
        fetchData();
      },
    });
  };

  const handleRejectCancellation = (id, paymentId) => {
    setPendingAction({
      title: "환불 거절",
      message: `결제 ${paymentId} 건 환불을 거절합니다.`,
      confirmLabel: "거절",
      showInput: true,
      inputLabel: "거절 사유 (선택)",
      inputPlaceholder: "거절 사유를 입력하세요",
      run: async (adminNote) => {
        await rejectCancellation(id, adminNote);
        showToast("환불 요청이 거절되었습니다.", "success");
        fetchData();
      },
    });
  };

  const handleStatusChange = (id, currentStatus) => {
    const nextStatus = currentStatus === "PENDING" ? "COMPLETED" : "PENDING";
    const actionText = nextStatus === "COMPLETED" ? "완료" : "대기중";

    setPendingAction({
      title: "문의 상태 변경",
      message: `해당 문의를 '${actionText}' 상태로 변경하시겠습니까?`,
      confirmLabel: "변경",
      run: async () => {
        await updateInquiryStatus(id, nextStatus);
        showToast("상태가 변경되었습니다.", "success");
        fetchData();
      },
    });
  };

  if (authLoading) return <p className={styles.statusText}>권한 확인 중...</p>;

  return (
    <main className={styles.page}>
      <div className={styles.heading}>
        <h1>관리자 페이지</h1>
        <p>회원 정보, 멘토 신청, 환불 및 1:1 문의를 통합 관리할 수 있습니다.</p>
      </div>

      <section className={styles.panel}>
        <div className={styles.tabGroup}>
          <button
            type="button"
            className={`${styles.tabButton} ${activeTab === "users" ? styles.tabActive : ""}`}
            onClick={() => handleTabChange("users")}
          >
            전체 회원 관리
          </button>
          <button
            type="button"
            className={`${styles.tabButton} ${activeTab === "mentors" ? styles.tabActive : ""}`}
            onClick={() => handleTabChange("mentors")}
          >
            멘토 신청 관리
          </button>
          <button
            type="button"
            className={`${styles.tabButton} ${activeTab === "questions" ? styles.tabActive : ""}`}
            onClick={() => handleTabChange("questions")}
          >
            질문 관리
          </button>
          <button
            type="button"
            className={`${styles.tabButton} ${activeTab === "refunds" ? styles.tabActive : ""}`}
            onClick={() => handleTabChange("refunds")}
          >
            환불 관리
          </button>
          <button
            type="button"
            className={`${styles.tabButton} ${activeTab === "inquiries" ? styles.tabActive : ""}`}
            onClick={() => handleTabChange("inquiries")}
          >
            1:1 문의 관리
          </button>
        </div>

        {/* 환불 관리 탭을 제외하고 검색/정렬 바 노출 (1:1 문의 탭 포함) */}
        {activeTab !== "refunds" && (
          <div className={styles.controlsBar}>
            <input
              type="text"
              placeholder={
                activeTab === "questions"
                  ? "작성자 이름 검색..."
                  : activeTab === "inquiries"
                  ? "제목, 이메일 또는 유형 검색..."
                  : "이름 또는 이메일 검색..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />

            <div className={styles.selectGroup}>
              {activeTab === "users" && (
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className={styles.selectBox}
                >
                  <option value="ALL">모든 역할</option>
                  <option value="USER">일반 사용자 (USER)</option>
                  <option value="MENTOR">멘토 (MENTOR)</option>
                  <option value="ADMIN">관리자 (ADMIN)</option>
                </select>
              )}

              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className={styles.selectBox}
              >
                <option value="latest">
                  {activeTab === "questions" ? "작성글 많은 순" : "최신순"}
                </option>
                <option value="oldest">
                  {activeTab === "questions" ? "작성글 적은 순" : "오래된순"}
                </option>
              </select>
            </div>
          </div>
        )}

        {loading && <p className={styles.statusText}>불러오는 중...</p>}
        {!loading && errorMessage && (
          <p className={styles.errorMessage}>{errorMessage}</p>
        )}

        {/* 1. 전체 회원 관리 탭 */}
        {!loading && !errorMessage && activeTab === "users" && (
          <>
            {usersPageData.content.length === 0 ? (
              <p className={styles.statusText}>
                {searchQuery ? "검색 결과가 없습니다." : "등록된 회원이 없습니다."}
              </p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>이메일</th>
                    <th>이름</th>
                    <th>역할</th>
                    <th>상태</th>
                    <th>가입일</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {usersPageData.content.map((u) => {
                    const isUserBlocked = Boolean(u.blocked ?? u.isBlocked);
                    return (
                      <tr key={u.id}>
                        <td className={styles.centerText}>{u.id}</td>
                        <td className={styles.ellipsisCell}>{u.email || "OAuth 계정"}</td>
                        <td className={styles.boldText}>{u.name}</td>
                        <td>
                          <span
                            className={
                              u.role === "ADMIN"
                                ? styles.roleAdmin
                                : u.role === "MENTOR"
                                ? styles.roleMentor
                                : styles.roleUser
                            }
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className={styles.centerText}>
                          {isUserBlocked ? (
                            <span className={styles.badgeBlocked}>차단됨</span>
                          ) : (
                            <span className={styles.badgeActive}>정상</span>
                          )}
                        </td>
                        <td>{formatDate(u.createdAt)}</td>
                        <td className={styles.centerText}>
                          <div className={styles.actionButtons}>
                            <button
                              type="button"
                              className={
                                isUserBlocked
                                  ? styles.unblockBtn
                                  : styles.blockBtn
                              }
                              onClick={() => handleBlockToggle(u.id, isUserBlocked)}
                            >
                              {isUserBlocked ? "해제" : "차단"}
                            </button>
                            <button
                              type="button"
                              className={styles.deleteBtn}
                              onClick={() => handleDeleteUser(u.id, u.name)}
                            >
                              삭제
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {usersPageData.totalPages > 1 && (
              <div className={styles.pager}>
                <button
                  type="button"
                  className={styles.pagerBtn}
                  onClick={() => goToUsersPage(usersPageNumber - 1)}
                  disabled={usersPageNumber <= 0}
                >
                  이전
                </button>
                <span className={styles.pagerInfo}>
                  {usersPageNumber + 1} / {usersPageData.totalPages} 페이지 (총 {usersPageData.totalElements}명)
                </span>
                <button
                  type="button"
                  className={styles.pagerBtn}
                  onClick={() => goToUsersPage(usersPageNumber + 1)}
                  disabled={usersPageNumber >= usersPageData.totalPages - 1}
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}

        {/* 2. 멘토 신청 관리 탭 */}
        {!loading && !errorMessage && activeTab === "mentors" && (
          <>
            {filteredMentorApps.length === 0 ? (
              <p className={styles.statusText}>
                {searchQuery ? "검색 결과가 없습니다." : "대기 중인 멘토 신청이 없습니다."}
              </p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>이메일</th>
                    <th>이름</th>
                    <th>관심 분야</th>
                    <th>신청일</th>
                    <th>승인 처리</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMentorApps.map((app) => (
                    <tr key={app.id}>
                      <td className={styles.centerText}>{app.id}</td>
                      <td className={styles.ellipsisCell}>{app.email || "-"}</td>
                      <td className={styles.ellipsisCell}>{app.name}</td>
                      <td className={styles.ellipsisCell}>{app.interests || "-"}</td>
                      <td>{formatDate(app.createdAt)}</td>
                      <td className={styles.centerText}>
                        <div className={styles.actionButtons}>
                          <button
                            type="button"
                            className={styles.approveBtn}
                            onClick={() => handleApprove(app.id)}
                          >
                            승인
                          </button>
                          <button
                            type="button"
                            className={styles.rejectBtn}
                            onClick={() => handleReject(app.id)}
                          >
                            거절
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}

        {/* 3. 게시글 관리 탭 */}
        {!loading && !errorMessage && activeTab === "questions" && (
          <>
            {authorSummary.length === 0 ? (
              <p className={styles.statusText}>
                {searchQuery ? "검색 결과가 없습니다." : "등록된 게시글이 없습니다."}
              </p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>번호</th>
                    <th>작성자 이름</th>
                    <th>역할</th>
                    <th>총 작성글 수</th>
                    <th>작성글 보기</th>
                  </tr>
                </thead>
                <tbody>
                  {authorSummary.map((item, index) => {
                    const isExpanded = expandedUserId === item.id;
                    const userQuestions = userQuestionsMap[item.id] || [];
                    const isSubLoading = subLoadingId === item.id;

                    return (
                      <React.Fragment key={item.id}>
                        <tr>
                          <td className={styles.centerText}>{index + 1}</td>
                          <td className={styles.boldText}>{item.name}</td>
                          <td>
                            <span
                              className={
                                item.role === "ADMIN"
                                  ? styles.roleAdmin
                                  : item.role === "MENTOR"
                                  ? styles.roleMentor
                                  : styles.roleUser
                              }
                            >
                              {item.role}
                            </span>
                          </td>
                          <td className={styles.centerText}>
                            <span className={styles.highlightCount}>{item.count}개</span>
                          </td>
                          <td className={styles.centerText}>
                            <button
                              type="button"
                              className={styles.expandToggleBtn}
                              onClick={() => handleToggleExpand(item.id)}
                            >
                              {isExpanded ? "닫기 ▲" : "작성글 보기 ▼"}
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr>
                            <td colSpan="5" className={styles.subTableWrapperCell}>
                              <div className={styles.subTableContainer}>
                                <p className={styles.subTableTitle}>
                                  📌 {item.name} 님이 작성한 질문 목록
                                </p>
                                {isSubLoading ? (
                                  <p className={styles.subLoadingText}>불러오는 중...</p>
                                ) : userQuestions.length === 0 ? (
                                  <p className={styles.subLoadingText}>작성한 질문이 없습니다.</p>
                                ) : (
                                  <table className={styles.subTable}>
                                    <thead>
                                      <tr>
                                        <th>분류</th>
                                        <th>제목</th>
                                        <th>답변</th>
                                        <th>좋아요</th>
                                        <th>등록일</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {userQuestions.map((q) => (
                                        <tr key={q.id}>
                                          <td className={styles.subTableCategory}>
                                            [{q.category || "기타"}]
                                          </td>
                                          <td>
                                            <Link
                                              href={`/questions/${q.id}`}
                                              target="_blank"
                                              className={styles.subTableLink}
                                            >
                                              {q.title}
                                            </Link>
                                          </td>
                                          <td className={styles.centerText}>{q.answerCount ?? 0}</td>
                                          <td className={styles.centerText}>❤️ {q.likeCount ?? 0}</td>
                                          <td className={styles.centerTextSecondary}>
                                            {q.createdAt?.slice(0, 10)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}
          </>
        )}

        {/* 4. 환불 관리 탭 */}
        {!loading && !errorMessage && activeTab === "refunds" && (
          <>
            {cancellations.length === 0 ? (
              <p className={styles.statusText}>대기 중인 환불 요청이 없습니다.</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>결제 ID</th>
                    <th>신청자</th>
                    <th>멘토</th>
                    <th>금액</th>
                    <th>환불 사유</th>
                    <th>요청일</th>
                    <th>처리</th>
                  </tr>
                </thead>
                <tbody>
                  {cancellations.map((c) => (
                    <tr key={c.id}>
                      <td className={styles.centerText}>{c.id}</td>
                      <td className={styles.ellipsisCell}>{c.paymentId}</td>
                      <td className={styles.ellipsisCell}>
                        {c.userName || "-"}
                        {c.userId != null && <span className={styles.subText}> (#{c.userId})</span>}
                      </td>
                      <td className={styles.ellipsisCell}>
                        {c.mentorName || "-"}
                        {c.mentorId != null && <span className={styles.subText}> (#{c.mentorId})</span>}
                      </td>
                      <td className={styles.rightText}>{Number(c.amount || 0).toLocaleString()}원</td>
                      <td className={styles.reasonCell}>{c.reason || "-"}</td>
                      <td>{formatDate(c.createdAt)}</td>
                      <td className={styles.centerText}>
                        <div className={styles.actionButtons}>
                          <button
                            type="button"
                            className={styles.approveBtn}
                            onClick={() => handleApproveCancellation(c.id, c.paymentId)}
                          >
                            승인
                          </button>
                          <button
                            type="button"
                            className={styles.rejectBtn}
                            onClick={() => handleRejectCancellation(c.id, c.paymentId)}
                          >
                            거절
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}

        {/* 5. 1:1 문의 관리 탭 */}
        {!loading && !errorMessage && activeTab === "inquiries" && (
          <>
            {filteredInquiries.length === 0 ? (
              <p className={styles.statusText}>
                {searchQuery ? "검색 결과가 없습니다." : "접수된 1:1 문의 내역이 없습니다."}
              </p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>유형</th>
                    <th>회신 이메일</th>
                    <th>제목 (클릭하여 상세 보기)</th>
                    <th>접수일</th>
                    <th>상태 관리</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInquiries.map((item) => (
                    <tr key={item.id}>
                      <td className={styles.centerText}>{item.id}</td>
                      <td>
                        <span className={styles.inquiryCategory}>[{item.category}]</span>
                      </td>
                      <td className={styles.ellipsisCell}>{item.email}</td>
                      <td
                        className={`${styles.ellipsisCell} ${styles.inquiryTitleLink}`}
                        title="클릭하여 상세 내용 보기"
                        onClick={() => setSelectedInquiry(item)}
                      >
                        {item.title}
                      </td>
                      <td>{formatDate(item.createdAt)}</td>
                      <td className={styles.centerText}>
                        <div className={styles.statusControlGroup}>
                          <span
                            className={
                              item.status === "PENDING"
                                ? styles.badgeBlocked
                                : styles.badgeActive
                            }
                          >
                            {item.status === "PENDING" ? "대기중" : "완료"}
                          </span>
                          <button
                            type="button"
                            className={styles.statusChangeBtn}
                            onClick={() => handleStatusChange(item.id, item.status)}
                          >
                            상태변경
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </section>

      {/* 1:1 문의 상세 보기 모달 */}
      {selectedInquiry && (
        <div
          className={styles.modalOverlay}
          onClick={() => setSelectedInquiry(null)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3>1:1 문의 상세 내용</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setSelectedInquiry(null)}
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <div>
                <strong>유형:</strong>{" "}
                <span className={styles.inquiryCategory}>
                  [{selectedInquiry.category}]
                </span>
              </div>
              <div>
                <strong>회신 이메일:</strong> {selectedInquiry.email}
              </div>
              <div>
                <strong>접수일:</strong> {formatDate(selectedInquiry.createdAt)}
              </div>
              <div>
                <strong>상태:</strong>{" "}
                {selectedInquiry.status === "PENDING" ? "대기중" : "완료"}
              </div>
              <div>
                <strong>제목:</strong> {selectedInquiry.title}
              </div>
              <div>
                <strong>상세 내용:</strong>
                <div className={styles.modalTextBox}>
                  {selectedInquiry.content}
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.modalConfirmBtn}
                onClick={() => setSelectedInquiry(null)}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!pendingAction}
        title={pendingAction?.title}
        message={pendingAction?.message}
        confirmLabel={pendingAction?.confirmLabel || "확인"}
        danger={pendingAction?.danger}
        showInput={pendingAction?.showInput}
        inputLabel={pendingAction?.inputLabel}
        inputPlaceholder={pendingAction?.inputPlaceholder}
        submitting={actionSubmitting}
        onConfirm={runPendingAction}
        onCancel={() => setPendingAction(null)}
      />
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