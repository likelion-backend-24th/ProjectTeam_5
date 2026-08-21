"use client";

import React, { useEffect, useState, useCallback, useMemo, act } from "react";
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
} from "@/lib/admin";
import { getQuestions, deleteQuestion } from "@/lib/questions";
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

      // 📌 작성글 목록 최신순(등록일 및 ID 기준) 정렬 적용
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

    if (authLoading)
      return <p className={styles.statusText}>권한 확인 중...</p>;
  };

  return (
    <main className={styles.page}>
      <div className={styles.heading}>
        <div>
          <h1>관리자 페이지</h1>
          <p>
            회원 정보, 멘토 신청 및 커뮤니티 게시글을 통합 관리할 수 있습니다.
          </p>
        </div>
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
        </div>

        {activeTab !== "refunds" && (
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
                {searchQuery
                  ? "검색 결과가 없습니다."
                  : "등록된 회원이 없습니다."}
              </p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ width: "50px", textAlign: "center" }}>ID</th>
                    <th style={{ width: "180px" }}>이메일</th>
                    <th style={{ width: "90px" }}>이름</th>
                    <th style={{ width: "70px" }}>역할</th>
                    <th style={{ width: "60px", textAlign: "center" }}>상태</th>
                    <th style={{ width: "90px" }}>가입일</th>
                    <th style={{ width: "110px", textAlign: "center" }}>
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const isUserBlocked = Boolean(u.blocked ?? u.isBlocked);

                    return (
                      <tr key={u.id}>
                        <td style={{ textAlign: "center" }}>{u.id}</td>
                        <td className={styles.ellipsisCell}>
                          {u.email || "OAuth 계정"}
                        </td>
                        <td
                          className={styles.ellipsisCell}
                          style={{ fontWeight: "bold", color: "#333" }}
                        >
                          {u.name}
                        </td>
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
                        <td style={{ textAlign: "center" }}>
                          {isUserBlocked ? (
                            <span className={styles.badgeBlocked}>차단됨</span>
                          ) : (
                            <span className={styles.badgeActive}>정상</span>
                          )}
                        </td>
                        <td>{formatDate(u.createdAt)}</td>
                        <td style={{ textAlign: "center" }}>
                          <div className={styles.actionButtons}>
                            <button
                              type="button"
                              className={
                                isUserBlocked
                                  ? styles.unblockBtn
                                  : styles.blockBtn
                              }
                              onClick={() =>
                                handleBlockToggle(u.id, isUserBlocked)
                              }
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
                {searchQuery
                  ? "검색 결과가 없습니다."
                  : "대기 중인 멘토 신청이 없습니다."}
              </p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ width: "60px", textAlign: "center" }}>ID</th>
                    <th style={{ width: "180px" }}>이메일</th>
                    <th style={{ width: "100px" }}>이름</th>
                    <th style={{ width: "140px" }}>관심 분야</th>
                    <th style={{ width: "100px" }}>신청일</th>
                    <th style={{ width: "120px", textAlign: "center" }}>
                      승인 처리
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMentorApps.map((app) => (
                    <tr key={app.id}>
                      <td style={{ textAlign: "center" }}>{app.id}</td>
                      <td className={styles.ellipsisCell}>
                        {app.email || "-"}
                      </td>
                      <td className={styles.ellipsisCell}>{app.name}</td>
                      <td className={styles.ellipsisCell}>
                        {app.interests || "-"}
                      </td>
                      <td>{formatDate(app.createdAt)}</td>
                      <td style={{ textAlign: "center" }}>
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
                {searchQuery
                  ? "검색 결과가 없습니다."
                  : "등록된 게시글이 없습니다."}
              </p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ width: "80px", textAlign: "center" }}>번호</th>
                    <th style={{ width: "200px" }}>작성자 이름</th>
                    <th style={{ width: "120px" }}>역할</th>
                    <th style={{ width: "120px", textAlign: "center" }}>
                      총 작성글 수
                    </th>
                    <th style={{ width: "150px", textAlign: "center" }}>
                      작성글 보기
                    </th>
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
                          <td style={{ textAlign: "center" }}>{index + 1}</td>
                          <td>
                            <span style={{ fontWeight: "bold", color: "#333" }}>
                              {item.name}
                            </span>
                          </td>
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
                          <td style={{ textAlign: "center" }}>
                            <span
                              style={{ fontWeight: "bold", color: "#2867e8" }}
                            >
                              {item.count}개
                            </span>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <button
                              type="button"
                              className={styles.askButton}
                              style={{
                                padding: "6px 12px",
                                fontSize: "12px",
                                cursor: "pointer",
                              }}
                              onClick={() => handleToggleExpand(item.id)}
                            >
                              {isExpanded ? "닫기 ▲" : "작성글 보기 ▼"}
                            </button>
                          </td>
                        </tr>

                        {/* 아코디언 펼쳐짐 영역 */}
                        {isExpanded && (
                          <tr>
                            <td
                              colSpan="5"
                              style={{
                                backgroundColor: "#f9fbff",
                                padding: "16px",
                              }}
                            >
                              <div
                                style={{
                                  border: "1px solid #d0e1fd",
                                  borderRadius: "8px",
                                  padding: "12px",
                                  background: "#fff",
                                }}
                              >
                                <p
                                  style={{
                                    fontWeight: "bold",
                                    marginBottom: "8px",
                                    color: "#2867e8",
                                    fontSize: "13px",
                                  }}
                                >
                                  📌 {item.name} 님이 작성한 질문 목록
                                </p>
                                {isSubLoading ? (
                                  <p
                                    style={{
                                      textAlign: "center",
                                      padding: "12px",
                                      color: "#666",
                                    }}
                                  >
                                    불러오는 중...
                                  </p>
                                ) : userQuestions.length === 0 ? (
                                  <p
                                    style={{
                                      textAlign: "center",
                                      padding: "12px",
                                      color: "#666",
                                    }}
                                  >
                                    작성한 질문이 없습니다.
                                  </p>
                                ) : (
                                  <table
                                    style={{
                                      width: "100%",
                                      borderCollapse: "collapse",
                                      fontSize: "13px",
                                    }}
                                  >
                                    <thead>
                                      <tr
                                        style={{
                                          borderBottom: "1px solid #eee",
                                          textAlign: "left",
                                          color: "#555",
                                        }}
                                      >
                                        <th
                                          style={{
                                            padding: "6px",
                                            width: "80px",
                                          }}
                                        >
                                          분류
                                        </th>
                                        <th style={{ padding: "6px" }}>제목</th>
                                        <th
                                          style={{
                                            padding: "6px",
                                            width: "60px",
                                            textAlign: "center",
                                          }}
                                        >
                                          답변
                                        </th>
                                        <th
                                          style={{
                                            padding: "6px",
                                            width: "60px",
                                            textAlign: "center",
                                          }}
                                        >
                                          좋아요
                                        </th>
                                        <th
                                          style={{
                                            padding: "6px",
                                            width: "90px",
                                            textAlign: "center",
                                          }}
                                        >
                                          등록일
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {userQuestions.map((q) => (
                                        <tr
                                          key={q.id}
                                          style={{
                                            borderBottom: "1px solid #f2f2f2",
                                          }}
                                        >
                                          <td
                                            style={{
                                              padding: "8px 6px",
                                              color: "#2867e8",
                                              fontWeight: "bold",
                                            }}
                                          >
                                            [{q.category || "기타"}]
                                          </td>
                                          <td style={{ padding: "8px 6px" }}>
                                            <Link
                                              href={`/questions/${q.id}`}
                                              target="_blank"
                                              style={{
                                                color: "#333",
                                                textDecoration: "none",
                                              }}
                                            >
                                              {q.title}
                                            </Link>
                                          </td>
                                          <td
                                            style={{
                                              padding: "8px 6px",
                                              textAlign: "center",
                                            }}
                                          >
                                            {q.answerCount ?? 0}
                                          </td>
                                          <td
                                            style={{
                                              padding: "8px 6px",
                                              textAlign: "center",
                                            }}
                                          >
                                            ❤️ {q.likeCount ?? 0}
                                          </td>
                                          <td
                                            style={{
                                              padding: "8px 6px",
                                              textAlign: "center",
                                              color: "#777",
                                            }}
                                          >
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
                    <th style={{ width: "60px", textAlign: "center" }}>ID</th>
                    <th style={{ width: "140px" }}>결제 ID</th>
                    <th style={{ width: "130px" }}>신청자</th>
                    <th style={{ width: "130px" }}>멘토</th>
                    <th style={{ width: "100px", textAlign: "right" }}>금액</th>
                    <th>환불 사유</th>
                    <th style={{ width: "100px" }}>요청일</th>
                    <th style={{ width: "140px", textAlign: "center" }}>처리</th>
                  </tr>
                </thead>
                <tbody>
                  {cancellations.map((c) => (
                    <tr key={c.id}>
                      <td style={{ textAlign: "center" }}>{c.id}</td>
                      <td className={styles.ellipsisCell}>{c.paymentId}</td>
                      <td className={styles.ellipsisCell}>
                        {c.userName || "-"}
                        {c.userId != null && <span style={{ color: "#9ca3af" }}> (#{c.userId})</span>}
                      </td>
                      <td className={styles.ellipsisCell}>
                        {c.mentorName || "-"}
                        {c.mentorId != null && <span style={{ color: "#9ca3af" }}> (#{c.mentorId})</span>}
                      </td>
                      <td style={{ textAlign: "right" }}>{Number(c.amount || 0).toLocaleString()}원</td>
                      <td className={styles.reasonCell}>{c.reason || "-"}</td>
                      <td>{formatDate(c.createdAt)}</td>
                      <td style={{ textAlign: "center" }}>
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
