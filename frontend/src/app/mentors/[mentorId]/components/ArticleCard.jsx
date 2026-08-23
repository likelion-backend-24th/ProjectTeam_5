"use client";

import Link from "next/link";
import styles from "../page.module.css";

export default function ArticleCard({ article, index, mentorId, isOwner, isAccessValid, onLockedClick }) {
  const isPostAccessible = isOwner || article.isPublic !== false || isAccessValid;

  // 백엔드가 아직 안 주는 지표(좋아요/댓글/조회수)는 데모용 자리표시자 숫자로 대체한다.
  const likeCount = article.likeCount ?? 128 - index * 8;
  const commentCount = article.commentCount ?? Math.max(0, 23 - index);
  const viewCount = article.viewCount ?? (index === 0 ? "1.2K" : index === 1 ? "892" : index === 2 ? "1.1K" : "731");

  if (!isPostAccessible) {
    return (
      <div className={styles.articleCardWrapper}>
        <div className={styles.articleCardLocked} onClick={onLockedClick}>
          <div className={styles.lockNoticeInner}>
            <span className={styles.lockEmoji}>🔒</span>
            <div>
              <span className={styles.articleCategory}>{article.category || "일반"}</span>
              <h4 className={styles.lockedTitle}>{article.title}</h4>
              <p className={styles.lockedDesc}>구독자 전용 게시글입니다. 클릭하여 구독 후 확인해보세요!</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.articleCardWrapper}>
      <Link className={styles.articleCard} href={`/mentors/${mentorId}/posts/${article.id}`}>
        <div className={styles.articleBody}>
          <div className={styles.articleTop}>
            <div className={styles.articleTopLeft}>
              <span className={styles.articleCategory}>{article.category || "일반"}</span>
              <span className={article.isPublic !== false ? styles.visibilityPublic : styles.visibilityPrivate}>
                {article.isPublic !== false ? "전체공개" : "🔒 구독자전용"}
              </span>
            </div>
            <span className={styles.date}>{article.createdAt ? article.createdAt.replace("T", " ").substring(0, 10) : ""}</span>
          </div>
          <h3 className={styles.articleTitle}>{article.title}</h3>
          <div className={styles.articleBottom}>
            <div className={styles.articleStats}>
              <span>♡ {likeCount}</span>
              <span>💬 {commentCount}</span>
              <span>◉ {viewCount}</span>
              <span className={styles.bookmark}>♡</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
