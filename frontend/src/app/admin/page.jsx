"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import {
  getAllUsers,
  blockUser,
  unblockUser,
  deleteUserByAdmin,
  getMentorApplications,
  approveMentor,
  rejectMentor,
} from "@/lib/admin";

import styles from "./page.module.css";

export default function AdminPage() {
  const router = useRouter();
  const { user, isLoggedIn, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState("users"); 
  const [users, setUsers] = useState([]);
  const [mentorApps, setMentorApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      if (activeTab === "users") {
        const data = await getAllUsers();
        setUsers(data || []);
      } else {
        const data = await getMentorApplications();
        setMentorApps(data || []);
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

  // 회원 차단 / 해제
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

  // 회원 강제 삭제
  const handleDeleteUser = async (userId, userName) => {
    if (
      !confirm(
        `정말로 회원 '${userName}'(ID: ${userId})을 강제 삭제하시겠습니까?\n이 작업은 복구할 수 없습니다.`
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

  // 멘토 승인
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

  // 멘토 거절
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

  if (authLoading) return <p className={styles.statusText}>권한 확인 중...</p>;

  return (
    <main className={styles.page}>
      <div className={styles.heading}>
        <div>
          <h1>관리자 페이지</h1>
          <p>회원 정보 관리 및 멘토 신청을 승인/거절할 수 있습니다.</p>
        </div>
      </div>

      <section className={styles.panel}>
        <div className={styles.tabGroup}>
          <button
            type="button"
            className={`${styles.tabButton} ${
              activeTab === "users" ? styles.tabActive : ""
            }`}
            onClick={() => setActiveTab("users")}
          >
            전체 회원 관리
          </button>
          <button
            type="button"
            className={`${styles.tabButton} ${
              activeTab === "mentors" ? styles.tabActive : ""
            }`}
            onClick={() => setActiveTab("mentors")}
          >
            멘토 신청 관리
          </button>
        </div>

        {loading && <p className={styles.statusText}>불러오는 중...</p>}
        {!loading && errorMessage && (
          <p className={styles.errorMessage}>{errorMessage}</p>
        )}

        {/* 1. 회원 목록 탭 */}
        {!loading && !errorMessage && activeTab === "users" && (
          <>
            {users.length === 0 ? (
              <p className={styles.statusText}>등록된 회원이 없습니다.</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ width: "60px", textAlign: "center" }}>ID</th>
                    <th>이메일</th>
                    <th>이름</th>
                    <th>역할</th>
                    <th style={{ textAlign: "center" }}>상태</th>
                    <th>가입일</th>
                    <th style={{ textAlign: "center" }}>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isUserBlocked = Boolean(u.blocked ?? u.isBlocked);

                    return (
                      <tr key={u.id}>
                        <td style={{ textAlign: "center" }}>{u.id}</td>
                        <td>{u.email || "OAuth 계정"}</td>
                        <td>{u.name}</td>
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

        {/* 2. 멘토 신청 탭 */}
        {!loading && !errorMessage && activeTab === "mentors" && (
          <>
            {mentorApps.length === 0 ? (
              <p className={styles.statusText}>
                대기 중인 멘토 신청이 없습니다.
              </p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ width: "60px", textAlign: "center" }}>ID</th>
                    <th>이메일</th>
                    <th>이름</th>
                    <th>관심 분야</th>
                    <th>신청일</th>
                    <th style={{ textAlign: "center" }}>승인 처리</th>
                  </tr>
                </thead>
                <tbody>
                  {mentorApps.map((app) => (
                    <tr key={app.id}>
                      <td style={{ textAlign: "center" }}>{app.id}</td>
                      <td>{app.email || "-"}</td>
                      <td>{app.name}</td>
                      <td>{app.interests || "-"}</td>
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