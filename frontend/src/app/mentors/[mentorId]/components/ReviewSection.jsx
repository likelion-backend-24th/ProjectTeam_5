"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/app/contexts/ToastContext";
import ConfirmDialog from "@/components/modal/ConfirmDialog";
import { getMentorReviews, submitMentorReview, deleteMentorReview } from "@/lib/mentors";
import styles from "../page.module.css";

export default function ReviewSection({ mentorId, reviewCount, isOwner, isLoggedIn, currentUserId, onMentorRefresh }) {
  const { showToast } = useToast();
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewDeleteTarget, setReviewDeleteTarget] = useState(null);
  const [deletingReview, setDeletingReview] = useState(false);

  const loadReviews = async () => {
    setReviewsLoading(true);
    try {
      const data = await getMentorReviews(mentorId);
      setReviews(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mentorId]);

  const handleSubmitReview = async () => {
    if (!isLoggedIn) {
      showToast("로그인이 필요한 서비스입니다.", "error");
      return;
    }
    if (submittingReview) return;

    setSubmittingReview(true);
    try {
      await submitMentorReview(mentorId, { rating: reviewRating, comment: reviewComment.trim() });
      setReviewComment("");
      setReviewRating(5);
      await loadReviews();
      await onMentorRefresh();
      showToast("리뷰가 등록되었습니다.", "success");
    } catch (err) {
      showToast(err.message || "리뷰 등록에 실패했습니다.", "error");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = (reviewId) => setReviewDeleteTarget(reviewId);

  const confirmDeleteReview = async () => {
    const reviewId = reviewDeleteTarget;
    if (!reviewId) return;
    setDeletingReview(true);
    try {
      await deleteMentorReview(mentorId, reviewId);
      await loadReviews();
      await onMentorRefresh();
      setReviewDeleteTarget(null);
    } catch (err) {
      showToast(err.message || "리뷰 삭제에 실패했습니다.", "error");
    } finally {
      setDeletingReview(false);
    }
  };

  return (
    <div className={styles.reviewContainer}>
    <h3>리뷰 ({reviewCount})</h3>

      {!isOwner && isLoggedIn && (
        <div className={styles.reviewForm}>
          <div className={styles.reviewStars}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setReviewRating(n)}
                className={`${styles.starBtn} ${n <= reviewRating ? styles.starBtnActive : ""}`}
                aria-label={`별점 ${n}점`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            placeholder="이 멘토에 대한 리뷰를 남겨주세요."
            maxLength={1000}
            rows={3}
            className={styles.reviewTextarea}
          />
          <div className={styles.reviewSubmitRow}>
            <button type="button" onClick={handleSubmitReview} disabled={submittingReview} className={styles.reviewSubmitBtn}>
              {submittingReview ? "등록 중..." : "리뷰 등록"}
            </button>
          </div>
          <p className={styles.reviewFormNotice}>
            이 멘토를 구독한 적 있는 유저만 리뷰를 남길 수 있습니다. 이미 남긴 리뷰가 있으면 내용이 덮어써집니다.
          </p>
        </div>
      )}

      {reviewsLoading ? (
        <p className={styles.reviewStatusText}>불러오는 중...</p>
      ) : reviews.length === 0 ? (
        <p className={styles.reviewStatusText}>등록된 리뷰가 없습니다.</p>
      ) : (
        <div className={styles.reviewList}>
          {reviews.map((r) => (
            <div key={r.id} className={styles.reviewCard}>
              <div className={styles.reviewCardHeader}>
                <div className={styles.reviewCardAuthor}>
                  <strong>{r.userName}</strong>
                  <span className={styles.reviewCardStars}>
                    {"★".repeat(r.rating)}
                    {"☆".repeat(5 - r.rating)}
                  </span>
                </div>
                {String(r.userId) === String(currentUserId) && (
                  <button type="button" onClick={() => handleDeleteReview(r.id)} className={styles.reviewDeleteBtn}>
                    삭제
                  </button>
                )}
              </div>
              {r.comment && <p className={styles.reviewComment}>{r.comment}</p>}
              <p className={styles.reviewDate}>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}</p>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!reviewDeleteTarget}
        title="리뷰 삭제"
        message="이 리뷰를 삭제하시겠습니까?"
        confirmLabel="삭제"
        danger
        submitting={deletingReview}
        onConfirm={confirmDeleteReview}
        onCancel={() => setReviewDeleteTarget(null)}
      />
    </div>
  );
}