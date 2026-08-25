"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { FaHeart, FaRegHeart, FaTrash } from "react-icons/fa";
import { useAuth } from "@/app/contexts/AuthContext";
import { downloadFile } from "@/lib/attachments";
import { getAccessToken } from "@/lib/tokenStore";
import { API_URL as BACKEND_URL } from "@/lib/client";
import ConfirmDialog from "@/components/modal/ConfirmDialog";
import { useToast } from "@/app/contexts/ToastContext";
import styles from "./page.module.css";

export default function MentorPostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user: authUser } = useAuth();
  const { showToast } = useToast();

  const currentUserId = authUser?.id || authUser?.userId || (typeof window !== "undefined" ? localStorage.getItem("userId") : null);

  const mentorId = params?.mentorId;
  const postId = params?.postId;

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isForbidden, setIsForbidden] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", content: "", category: "", isPublic: true, attachmentIds: [] });
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);

  // --- 댓글 관련 상태 ---
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // 공통 헤더 생성 함수
  const getAuthHeaders = useCallback(() => {
    const token = getAccessToken();
    const headers = { "Content-Type": "application/json" };
    if (currentUserId) headers["X-USER-ID"] = String(currentUserId);
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  }, [currentUserId]);

  // 댓글 목록 불러오기
  const loadComments = useCallback(async () => {
    if (!mentorId || !postId || mentorId === "undefined" || postId === "undefined") return;

    setCommentsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/mentors/${mentorId}/posts/${postId}/comments`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        const data = await res.json();
        setComments(Array.isArray(data) ? data : data.content || []);
      }
    } catch (error) {
      console.error("댓글 조회 실패:", error);
    } finally {
      setCommentsLoading(false);
    }
  }, [mentorId, postId, getAuthHeaders]);

  const loadPost = useCallback(async () => {
    if (!mentorId || !postId || mentorId === "undefined" || postId === "undefined") {
      return;
    }
    setLoading(true);
    setErrorMessage("");
    setIsForbidden(false);

    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/mentors/${mentorId}/posts/${postId}`, {
        method: "GET",
        headers: getAuthHeaders(),
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
      setEditForm({
        title: data.title,
        content: data.content,
        category: data.category ?? "",
        isPublic: data.isPublic ?? true,
        attachmentIds: [
          ...(data.images ?? []).map((f) => f.attachId),
          ...(data.files ?? []).map((f) => f.attachId),
        ],
      });

      if (currentUserId && data.mentorId && String(data.mentorId) === String(currentUserId)) {
        setIsOwner(true);
      }
    } catch (error) {
      console.error("멘토 게시글 조회 실패:", error);
      setErrorMessage(error.message || "게시글을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [mentorId, postId, currentUserId, getAuthHeaders]);

  useEffect(() => {
    if (mentorId && postId) {
      loadPost();
      loadComments();
    }
  }, [loadPost, loadComments, mentorId, postId]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editForm.title || !editForm.content) {
      showToast("제목과 내용을 모두 입력해주세요.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/mentors/${mentorId}/posts/${postId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        showToast("게시글이 수정되었습니다.", "success");
        setIsEditing(false);
        loadPost();
      } else {
        showToast("게시글 수정에 실패했습니다.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("서버 오류가 발생했습니다.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async (file) => {
    try {
      await downloadFile(file.attachId, file.originalFileName);
    } catch (err) {
      showToast(err.message || "파일 다운로드에 실패했습니다.", "error");
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/mentors/${mentorId}/posts/${postId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        showToast("게시글이 삭제되었습니다.", "success");
        router.push(`/mentors/${mentorId}`);
      } else {
        showToast("게시글 삭제에 실패했습니다.", "error");
        setDeleting(false);
      }
    } catch (err) {
      console.error(err);
      showToast("서버 오류가 발생했습니다.", "error");
      setDeleting(false);
    }
  };

  const handleToggleLike = async () => {
    if (!currentUserId) {
      showToast("로그인 후 이용 가능합니다.", "error");
      router.push("/login");
      return;
    }
    if (isLikeLoading) return;

    const prevIsLiked = post?.isLiked ?? post?.liked ?? false;
    const prevLikeCount = post?.likeCount ?? 0;

    const nextIsLiked = !prevIsLiked;
    const nextLikeCount = nextIsLiked ? prevLikeCount + 1 : Math.max(0, prevLikeCount - 1);

    setPost((prev) => ({
      ...prev,
      isLiked: nextIsLiked,
      liked: nextIsLiked,
      likeCount: nextLikeCount,
    }));

    try {
      setIsLikeLoading(true);
      const method = prevIsLiked ? "DELETE" : "POST";
      const res = await fetch(`${BACKEND_URL}/api/v1/mentors/${mentorId}/posts/${postId}/likes`, {
        method,
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        throw new Error("좋아요 처리에 실패했습니다.");
      }
    } catch (err) {
      console.error(err);
      setPost((prev) => ({
        ...prev,
        isLiked: prevIsLiked,
        liked: prevIsLiked,
        likeCount: prevLikeCount,
      }));
      showToast(err.message || "서버 오류가 발생했습니다.", "error");
    } finally {
      setIsLikeLoading(false);
    }
  };

  // --- 댓글 작성 처리 ---
  const handleCreateComment = async (e) => {
    e.preventDefault();
    if (!currentUserId) {
      showToast("로그인 후 댓글을 작성할 수 있습니다.", "error");
      router.push("/login");
      return;
    }

    if (!commentInput.trim()) {
      showToast("댓글 내용을 입력해주세요.", "error");
      return;
    }

    setSubmittingComment(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/mentors/${mentorId}/posts/${postId}/comments`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ content: commentInput }),
      });

      if (res.ok) {
        showToast("댓글이 작성되었습니다.", "success");
        setCommentInput("");
        loadComments();
      } else {
        showToast("댓글 작성에 실패했습니다.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("서버 오류가 발생했습니다.", "error");
    } finally {
      setSubmittingComment(false);
    }
  };

  // --- 댓글 삭제 처리 ---
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("댓글을 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/mentors/${mentorId}/posts/${postId}/comments/${commentId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        showToast("댓글이 삭제되었습니다.", "success");
        setComments((prev) => prev.filter((c) => (c.id || c.commentId) !== commentId));
      } else {
        showToast("댓글 삭제에 실패했습니다.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("서버 오류가 발생했습니다.", "error");
    }
  };

  const isLikedState = post?.isLiked ?? post?.liked ?? false;

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
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                {post.content}
              </ReactMarkdown>
            </div>

            {post.images && post.images.length > 0 && (
              <div style={{ marginTop: "30px" }}>
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

            {/* 좋아요 버튼 섹션 */}
            <div className={styles.likeSection}>
              <button
                type="button"
                className={styles.likeButton}
                onClick={handleToggleLike}
                disabled={isLikeLoading}
              >
                <div className={`${styles.likeIcon} ${isLikedState ? styles.likeIconActive : ""}`}>
                  {isLikedState ? <FaHeart /> : <FaRegHeart />}
                </div>
                <span className={styles.likeCount}>
                  좋아요 {post.likeCount ?? 0}
                </span>
              </button>
            </div>

            {/* --- 댓글 섹션 --- */}
            <section className={styles.commentSection}>
              <h3 className={styles.commentTitle}>댓글 ({comments.length})</h3>

              {/* 댓글 입력 폼 */}
              <form onSubmit={handleCreateComment} className={styles.commentForm}>
                <textarea
                  className={styles.commentInput}
                  placeholder={
                    currentUserId
                      ? "댓글을 입력하세요..."
                      : "로그인 후 댓글을 작성할 수 있습니다."
                  }
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  disabled={!currentUserId || submittingComment}
                />
                <button
                  type="submit"
                  className={styles.commentSubmitBtn}
                  disabled={!currentUserId || submittingComment}
                >
                  {submittingComment ? "등록 중..." : "등록"}
                </button>
              </form>

              {/* 댓글 목록 */}
              {commentsLoading ? (
                <p className={styles.statusText}>댓글을 불러오는 중...</p>
              ) : comments.length === 0 ? (
                <p className={styles.emptyComments}>작성된 댓글이 없습니다.</p>
              ) : (
                <div className={styles.commentList}>
                  {comments.map((comment) => {
                    const commentId = comment.id || comment.commentId;
                    const isCommentOwner =
                      currentUserId &&
                      String(comment.userId || comment.authorId) === String(currentUserId);

                    return (
                      <div key={commentId} className={styles.commentItem}>
                        <div className={styles.commentMeta}>
                          <div className={styles.commentAuthorInfo}>
                            <span className={styles.commentAuthor}>
                              {comment.authorName || comment.userName || "익명"}
                            </span>
                            <span className={styles.commentDate}>
                              {formatDate(comment.createdAt)}
                            </span>
                          </div>
                          {isCommentOwner && (
                            <button
                              type="button"
                              onClick={() => handleDeleteComment(commentId)}
                              className={styles.commentDeleteBtn}
                              title="댓글 삭제"
                            >
                              <FaTrash size={12} />
                            </button>
                          )}
                        </div>
                        <p className={styles.commentBody}>{comment.content}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </article>
        )}
      </section>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="게시글 삭제"
        message="정말 이 게시글을 삭제하시겠습니까?"
        confirmLabel="삭제"
        danger
        submitting={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
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