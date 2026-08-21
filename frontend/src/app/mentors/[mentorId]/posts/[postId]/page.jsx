"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/contexts/AuthContext";
import { downloadFile } from "@/lib/attachments";
import styles from "./page.module.css";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function MentorPostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user: authUser } = useAuth();
  
  const currentUserId = authUser?.id || authUser?.userId || (typeof window !== "undefined" ? localStorage.getItem("userId") : null);

  const mentorId = params?.mentorId;
  const postId = params?.postId;

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isForbidden, setIsForbidden] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", content: "" });
  const [submitting, setSubmitting] = useState(false);

  const loadPost = useCallback(async () => {
  if (!mentorId || !postId || mentorId === "undefined" || postId === "undefined") {
    return;
  }
  setLoading(true);
  setErrorMessage("");
  setIsForbidden(false);

    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("accessToken") || localStorage.getItem("token")
          : null;

      const headers = {
        "Content-Type": "application/json",
      };

      if (currentUserId) {
        headers["X-USER-ID"] = String(currentUserId);
      }
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${BACKEND_URL}/api/v1/mentors/${mentorId}/posts/${postId}`, {
        method: "GET",
        headers,
      });

      if (res.status === 403) {
        setIsForbidden(true);
        return;
      }
      if (res.status === 404) {
        throw new Error("존재하지 않는 게시글입니다.");
      }

      if (!res.ok) {
        const errorText = await res.text();
        console.error("서버 에러 응답:", errorText);
        throw new Error(`게시글을 불러오지 못했습니다. (코드: ${res.status})`);
      }

      const data = await res.json();
      setPost(data);
      setEditForm({ title: data.title, content: data.content });

      if (currentUserId && data.mentorId && String(data.mentorId) === String(currentUserId)) {
        setIsOwner(true);
      }
    } catch (error) {
      console.error("멘토 게시글 조회 실패:", error);
      setErrorMessage(error.message || "게시글을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [mentorId, postId, currentUserId]);

  useEffect(() => {
  if (mentorId && postId) { 
    loadPost();
  }
}, [loadPost, mentorId, postId]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editForm.title || !editForm.content) {
      alert("제목과 내용을 모두 입력해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
      const headers = { "Content-Type": "application/json" };
      if (currentUserId) headers["X-USER-ID"] = String(currentUserId);
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${BACKEND_URL}/api/v1/mentors/${mentorId}/posts/${postId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        alert("게시글이 수정되었습니다.");
        setIsEditing(false);
        loadPost();
      } else {
        alert("게시글 수정에 실패했습니다.");
      }
    } catch (err) {
      console.error(err);
      alert("서버 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async (file) => {
    try {
      await downloadFile(file.attachId, file.originalFileName);
    } catch (err) {
      alert(err.message || "파일 다운로드에 실패했습니다.");
    }
  };

  const handleDelete = async () => {
    if (!confirm("정말 이 게시글을 삭제하시겠습니까?")) return;

    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
      const headers = {};
      if (currentUserId) headers["X-USER-ID"] = String(currentUserId);
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${BACKEND_URL}/api/v1/mentors/${mentorId}/posts/${postId}`, {
        method: "DELETE",
        headers,
      });

      if (res.ok) {
        alert("게시글이 삭제되었습니다.");
        router.push(`/mentors/${mentorId}`);
      } else {
        alert("게시글 삭제에 실패했습니다.");
      }
    } catch (err) {
      console.error(err);
      alert("서버 오류가 발생했습니다.");
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.heading}>
        <div>
          <Link href={`/mentors/${mentorId}`} className={styles.backLink}>
            ← 멘토 프로필로
          </Link>
        </div>

        {!loading && !isForbidden && post && isOwner && !isEditing && (
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => setIsEditing(true)}
              style={{ padding: "8px 14px", background: "#f0f0f0", border: "1px solid #ccc", borderRadius: "4px", cursor: "pointer" }}
            >
              수정
            </button>
            <button
              onClick={handleDelete}
              style={{ padding: "8px 14px", background: "#ff4d4d", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
            >
              삭제
            </button>
          </div>
        )}
      </div>

      <section className={styles.panel}>
        {loading && <p className={styles.statusText}>게시글을 불러오는 중...</p>}

        {!loading && errorMessage && (
          <p className={styles.errorMessage}>{errorMessage}</p>
        )}

        {!loading && isForbidden && (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <span style={{ fontSize: "40px" }}>🔒</span>
            <h2 style={{ margin: "15px 0 10px", fontSize: "20px" }}>구독자 전용 콘텐츠입니다</h2>
            <p style={{ color: "#666", marginBottom: "20px" }}>
              이 게시글은 멘토를 구독한 유저만 조회할 수 있습니다.
            </p>
            <button
              type="button"
              onClick={() => router.push(`/mentors/${mentorId}`)}
              style={{
                padding: "10px 20px",
                backgroundColor: "#000",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              멘토 프로필로 돌아가기
            </button>
          </div>
        )}

        {!loading && !isForbidden && post && isEditing && (
          <form onSubmit={handleUpdate} style={{ padding: "20px 0" }}>
            <h2>게시글 수정</h2>
            <div style={{ margin: "15px 0" }}>
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }}
                required
              />
            </div>
            <div style={{ margin: "15px 0" }}>
              <textarea
                value={editForm.content}
                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                rows={8}
                style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }}
                required
              />
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="submit"
                disabled={submitting}
                style={{ padding: "8px 16px", background: "#000", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
              >
                {submitting ? "저장 중..." : "저장"}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                style={{ padding: "8px 16px", background: "#ddd", border: "none", borderRadius: "4px", cursor: "pointer" }}
              >
                취소
              </button>
            </div>
          </form>
        )}

        {!loading && !errorMessage && !isForbidden && post && !isEditing && (
          <article className={styles.article}>
            <h2 className={styles.postTitle}>{post.title}</h2>
            <div className={styles.metaInfo}>
              <span>작성일: {formatDate(post.createdAt)}</span>
              {post.updatedAt !== post.createdAt && (
                <span style={{ marginLeft: "10px", color: "#888" }}>
                  (수정됨: {formatDate(post.updatedAt)})
                </span>
              )}
            </div>
            
            <hr className={styles.divider} />
            
            <div className={styles.postContent}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {post.content}
              </ReactMarkdown>
            </div>

            {post.images && post.images.length > 0 && (
              <div style={{ marginTop: "30px" }}>
                <h4 style={{ marginBottom: "10px" }}>첨부 이미지</h4>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {post.images.map((img) => (
                    <img
                      key={img.attachId}
                      src={img.url}
                      alt="첨부 이미지"
                      style={{ width: "200px", borderRadius: "8px", border: "1px solid #ddd" }}
                    />
                  ))}
                </div>
              </div>
            )}

            {post.files && post.files.length > 0 && (
              <div style={{ marginTop: "20px" }}>
                <h4 style={{ marginBottom: "10px" }}>첨부 파일</h4>
                <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 6 }}>
                  {post.files.map((file) => (
                    <li key={file.attachId}>
                      <button
                        type="button"
                        onClick={() => handleDownload(file)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "8px 12px",
                          border: "1px solid #e5e7eb",
                          borderRadius: 8,
                          fontSize: 14,
                          background: "none",
                          cursor: "pointer",
                          color: "#374151",
                        }}
                      >
                        📎 {file.originalFileName} ({(file.size / 1024 / 1024).toFixed(2)}MB)
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>
        )}
      </section>
    </main>
  );
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(
    date.getDate()
  ).padStart(2, "0")}`;
}