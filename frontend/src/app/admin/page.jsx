"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/contexts/AuthContext";
import {
  getAllUsers,
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

import styles from "./page.module.css";

export default function AdminPage() {
  const router = useRouter();
  const { user, isLoggedIn, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
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
  const [cancelBusyId, setCancelBusyId] = useState(null);

  const [inquiries, setInquiries] = useState([]);
  const [selectedInquiry, setSelectedInquiry] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const usersData = await getAllUsers();
      setUsers(usersData || []);

      if (activeTab === "mentors") {
        const data = await getMentorApplications();
        setMentorApps(data || []);
      } else if (activeTab === "questions") {
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

  useEffect(() => {
    if (authLoading) return;

    if (!isLoggedIn || user?.role !== "ADMIN") {
      alert("관리자 권한이 필요합니다.");
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

  const filteredUsers = useMemo(() => {
    let list = [...users];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (u) =>
          (u.name || "").toLowerCase().includes(q) ||
          (u.email || "").toLowerCase().includes(q),
      );
    }

    if (roleFilter !== "ALL") {
      list = list.filter((u) => u.role === roleFilter);
    }

    list.sort((a, b) => {
      const idA = Number(a.id || 0);
      const idB = Number(b.id || 0);
      return sortOption === "latest" ? idB - idA : idA - idB;
    });

    return list;
  }, [users, searchQuery, roleFilter, sortOption]);

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
      alert("해당 유저의 작성글을 불러오는 데 실패했습니다.");
    } finally {
      setSubLoadingId(null);
    }
  };

  const handleBlockToggle = async (userId, isBlocked) => {
    const actionText = isBlocked ? "차단 해제" : "차단";
    if (!confirm(`해당 회원을 ${actionText}하시겠습니까?`)) return;

    try {
      if (isBlocked) {
        await unblockUser(userId);
      } else {
        await blockUser(userId);
      }
      alert(`${actionText} 처리되었습니다.`);
      fetchData();
    } catch (error) {
      alert(error.message || "처리에 실패했습니다.");
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (
      !confirm(
        `정말로 회원 '${userName}'(ID: ${userId})을 강제 삭제하시겠습니까?\n이 작업은 복구할 수 없습니다.`,
      )
    ) {
      return;
    }

    try {
      await deleteUserByAdmin(userId);
      alert("회원이 삭제되었습니다.");
      fetchData();
    } catch (error) {
      alert(error.message || "삭제에 실패했습니다.");
    }
  };

  const handleApprove = async (userId) => {
    if (!confirm("해당 회원을 멘토로 승인하시겠습니까?")) return;
    try {
      await approveMentor(userId);
      alert("멘토 승인이 완료되었습니다.");
      fetchData();
    } catch (error) {
      alert(error.message || "승인 처리에 실패했습니다.");
    }
  };

  const handleReject = async (userId) => {
    if (!confirm("해당 회원의 멘토 신청을 거절하시겠습니까?")) return;
    try {
      await rejectMentor(userId);
      alert("멘토 신청이 거절되었습니다.");
      fetchData();
    } catch (error) {
      alert(error.message || "거절 처리에 실패했습니다.");
    }
  };

  const handleApproveCancellation = async (id, paymentId) => {
    if (
      !confirm(
        `결제 ${paymentId}의 환불을 승인하시겠습니까? \n PortOne에 실제 취소 요청이 전송되며 되돌릴 수 없습니다.`,
      )
    )
      return;

    setCancelBusyId(id);

    try {
      await approveCancellation(id);
      alert("환불이 승인되었습니다.");
      fetchData();
    } catch (error) {
      alert(error.message || "승인 처리에 실패했습니다.");
    } finally {
      setCancelBusyId(null);
    }
  };

  const handleRejectCancellation = async (id, paymentId) => {
    const adminNote = window.prompt(`결제 ${paymentId} 건 환불을 거절합니다.`);
    if (adminNote === null) return;

    setCancelBusyId(id);
    try {
      await rejectCancellation(id, adminNote.trim());
      alert("환불 요청이 거절되었습니다.");
      fetchData();
    } catch (error) {
      alert(error.message || "거절 처리에 실패했습니다.");
    } finally {
      setCancelBusyId(null);
    }
  };

  const handleStatusChange = async (id, currentStatus) => {
    const nextStatus = currentStatus === "PENDING" ? "COMPLETED" : "PENDING";
    const actionText = nextStatus === "COMPLETED" ? "완료" : "대기중";

    if (!confirm(`해당 문의를 '${actionText}' 상태로 변경하시겠습니까?`)) return;

    try {
      await updateInquiryStatus(id, nextStatus);
      alert("상태가 변경되었습니다.");
      fetchData();
    } catch (error) {
      alert(error.message || "상태 변경에 실패했습니다.");
    }
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

        {activeTab !== "refunds" && activeTab !== "inquiries" && (
          <div className={styles.controlsBar}>
            <input
              type="text"
              placeholder={
                activeTab === "questions"
                  ? "작성자 이름 검색..."
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
            {filteredUsers.length === 0 ? (
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
                  {filteredUsers.map((u) => {
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
                            disabled={cancelBusyId === c.id}
                            onClick={() => handleApproveCancellation(c.id, c.paymentId)}
                          >
                            승인
                          </button>
                          <button
                            type="button"
                            className={styles.rejectBtn}
                            disabled={cancelBusyId === c.id}
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
              <p className={styles.statusText}>접수된 1:1 문의 내역이 없습니다.</p>
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