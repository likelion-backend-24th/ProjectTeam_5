"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { getMentorPost } from "@/lib/mentorPosts";
import { subscribeMentor } from "@/lib/subscriptions";

import styles from "./page.module.css";

export default function MentorPostDetailPage() {
  const params = useParams();
  const router = useRouter();

  const mentorId = params?.mentorId;
  const postId = params?.postId;

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // F-29: 구독 유도 모달 상태
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  const loadPost = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    setShowSubscriptionModal(false);

    try {
      const data = await getMentorPost(mentorId, postId);
      setPost(data);
    } catch (error) {
      console.error("멘토 게시글 조회 실패:", error);

      // client.js에서 던진 status가 403이거나 백엔드 메시지에 구독/권한 관련 내용이 있는 경우
      if (
        error.status === 403 ||
        error.message?.includes("구독") ||
        error.message?.includes("권한")
      ) {
        setShowSubscriptionModal(true);
      } else {
        setErrorMessage(error.message || "게시글을 불러오지 못했습니다.");
      }
    } finally {
      setLoading(false);
    }
  }, [mentorId, postId]);

  useEffect(() => {
    if (mentorId && postId) {
      loadPost();
    }
  }, [mentorId, postId, loadPost]);

  // 구독 신청 처리
  const handleSubscribe = async () => {
    const token =
      localStorage.getItem("accessToken") || localStorage.getItem("token");

    if (!token) {
      alert("구독 신청은 로그인 후 이용 가능합니다.");
      router.push("/login");
      return;
    }

    setSubscribing(true);
    try {
      await subscribeMentor(mentorId);
      alert("구독 신청이 완료되었습니다!");
      setShowSubscriptionModal(false);
      loadPost(); // 구독 완료 후 게시글 재조회
    } catch (error) {
      alert(error.message || "구독 처리 실패");
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.heading}>
        <div>
          <Link href="/questions" className={styles.backLink}>
            ← 전체 질문 목록으로
          </Link>
          <h1 style={{ marginTop: "8px" }}>멘토 전용 게시글</h1>
        </div>
      </div>

      <section className={styles.panel}>
        {loading && <p className={styles.statusText}>게시글을 불러오는 중...</p>}

        {!loading && errorMessage && (
          <p className={styles.errorMessage}>{errorMessage}</p>
        )}

        {/* 비구독자 블러 차단 영역 안내 */}
        {!loading && !errorMessage && showSubscriptionModal && (
          <div className={styles.blockedBox}>
            <span className={styles.lockIcon}>🔒</span>
            <h3>구독자 전용 콘텐츠입니다</h3>
            <p>이 게시글은 멘토 구독 유저만 조회할 수 있습니다.</p>
            <button
              type="button"
              className={styles.askButton}
              onClick={() => setShowSubscriptionModal(true)}
            >
              구독 안내 보기
            </button>
          </div>
        )}

        {/* 정상 구독자용 콘텐츠 영역 */}
        {!loading && !errorMessage && post && (
          <article className={styles.article}>
            <h2 className={styles.postTitle}>{post.title}</h2>
            <div className={styles.metaInfo}>
              <span>작성일: {formatDate(post.createdAt)}</span>
            </div>
            <hr className={styles.divider} />
            <div className={styles.postContent}>{post.content}</div>
          </article>
        )}
      </section>

      {/* F-29: 구독 유도 모달창 */}
      {showSubscriptionModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalBadge}>🔒 PREMIUM</div>
            <h2>멘토 구독이 필요합니다</h2>
            <p className={styles.modalDescription}>
              해당 게시글은 멘토의 정기 구독 유저 전용 콘텐츠입니다.
              <br />
              구독 신청 후 멘토의 모든 프리미엄 인사이트를 자유롭게 확인해보세요!
            </p>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => router.back()}
              >
                이전 페이지로
              </button>
              <button
                type="button"
                className={styles.askButton}
                onClick={handleSubscribe}
                disabled={subscribing}
              >
                {subscribing ? "처리 중..." : "지금 구독하기"}
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
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(
    date.getDate()
  ).padStart(2, "0")}`;
}