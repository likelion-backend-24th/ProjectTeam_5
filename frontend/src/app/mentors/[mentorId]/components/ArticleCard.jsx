"use client";

import Link from "next/link";
import styles from "../page.module.css";

export default function ArticleCard({ article, mentorId, isOwner, isAccessValid, onLockedClick }) {
  const isPostAccessible = isOwner || article.isPublic !== false || isAccessValid;

  // 썸네일 이미지 추출 (thumbnailUrl, imageUrl, 또는 images 배열의 첫 번째 객체/문자열)
  const thumbnail =
    article.thumbnailUrl ||
    article.imageUrl ||
    (Array.isArray(article.images) && article.images.length > 0
      ? (typeof article.images[0] === "string" ? article.images[0] : article.images[0]?.url)
      : null);

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
        <div className={styles.articleContent}>
          <div className={styles.articleBody}>
            <div className={styles.articleTop}>
              <div className={styles.articleTopLeft}>
                <span className={styles.articleCategory}>{article.category || "일반"}</span>
                <span className={article.isPublic !== false ? styles.visibilityPublic : styles.visibilityPrivate}>
                  {article.isPublic !== false ? "전체공개" : "🔒 구독자전용"}
                </span>
              </div>
              <span className={styles.date}>
                {article.createdAt ? article.createdAt.replace("T", " ").substring(0, 10) : ""}
              </span>
            </div>
            <h3 className={styles.articleTitle}>{article.title}</h3>
            <div className={styles.articleBottom}>
              <div className={styles.articleStats}>
                <span>♡ {article.likeCount ?? 0}</span>
                <span>👁 {article.viewCount ?? 0}</span>
              </div>
            </div>
          </div>

          {/* 이미지 존재 시 썸네일 영역 출력 */}
          {thumbnail && (
            <div className={styles.thumbnailWrapper}>
              <img src={thumbnail} alt={article.title} className={styles.articleThumbnail} />
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}