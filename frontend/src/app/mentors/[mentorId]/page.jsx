"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getMentorArticle,
  deleteMentorArticle,
  getArticleComments,
  createArticleComment,
  deleteArticleComment,
} from "@/lib/mentorArticles";
import { getMe } from "@/lib/auth";
import styles from "./page.module.css";

export default function MentorArticleDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [article, setArticle] = useState(null);
  const [comments, setComments] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const data = await getArticleComments(id);
      setComments(data.content ?? data ?? []);
    } catch (error) {
      console.error(error);
    }
  }, [id]);

  useEffect(() => {
    async function loadData() {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") || localStorage.getItem("accessToken") : null;
      try {
        const [articleData, userData] = await Promise.all([
          getMentorArticle(id),
          token ? getMe(token).catch(() => null) : Promise.resolve(null),
        ]);
        setArticle(articleData);
        setCurrentUser(userData);
        await fetchComments();
      } catch (error) {
        alert("게시글을 불러올 수 없습니다.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, fetchComments]);

  const handleDeleteArticle = async () => {
    if (!confirm("정말 이 칼럼을 삭제하시겠습니까?")) return;
    try {
      await deleteMentorArticle(id);
      router.push("/mentor-articles");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      if (confirm("로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?")) {
        router.push("/login");
      }
      return;
    }
    if (!commentText.trim()) return;

    try {
      setSubmitting(true);
      await createArticleComment(id, { content: commentText });
      setCommentText("");
      await fetchComments();
    } catch (error) {
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm("댓글을 삭제하시겠습니까?")) return;
    try {
      await deleteArticleComment(commentId);
      await fetchComments();
    } catch (error) {
      alert(error.message);
    }
  };

  if (loading) return <p className={styles.loading}>불러오는 중...</p>;
  if (!article) return null;

  const isArticleOwner = currentUser && (currentUser.id === article.authorId || currentUser.name === article.authorName);

  return (
    <main className={styles.container}>
      <Link href="/mentor-articles" className={styles.backLink}>← 칼럼 목록으로</Link>

      <article className={styles.article}>
        <header className={styles.header}>
          <span className={styles.category}>{article.category}</span>
          <h1>{article.title}</h1>
          <div className={styles.meta}>
            <span>작성자: {article.authorName} 멘토</span>
            <span>{article.createdAt?.slice(0, 10)}</span>
            {isArticleOwner && (
              <div className={styles.ownerActions}>
                <Link href={`/mentor-articles/write?edit=${article.id}`}>수정</Link>
                <button type="button" onClick={handleDeleteArticle}>삭제</button>
              </div>
            )}
          </div>
        </header>

        <div className={styles.body}>{article.content}</div>
      </article>

      <section className={styles.commentsSection}>
        <h3>답변 / 댓글 ({comments.length})</h3>

        <form onSubmit={handleCommentSubmit} className={styles.commentForm}>
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={currentUser ? "칼럼에 대한 의견이나 질문을 남겨주세요." : "로그인 후 댓글을 작성할 수 있습니다."}
            disabled={!currentUser || submitting}
            rows={3}
          />
          <button type="submit" disabled={!currentUser || submitting}>
            {submitting ? "등록 중..." : "등록"}
          </button>
        </form>

        <ul className={styles.commentList}>
          {comments.map((comment) => {
            const isCommentOwner = currentUser && (currentUser.id === comment.authorId || currentUser.name === comment.authorName);
            return (
              <li key={comment.id} className={styles.commentItem}>
                <div className={styles.commentMeta}>
                  <strong>{comment.authorName}</strong>
                  <span>{comment.createdAt?.slice(0, 10)}</span>
                  {isCommentOwner && (
                    <button type="button" onClick={() => handleDeleteComment(comment.id)}>삭제</button>
                  )}
                </div>
                <p>{comment.content}</p>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}