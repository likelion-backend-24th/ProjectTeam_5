"use client";

import styles from "../page.module.css";

export default function SubscribeModal({ currentPrice, canSubscribe, subscribing, onSubscribe, onClose }) {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <span className={styles.modalLockIcon}>🔒</span>
        <h2>구독자 전용 콘텐츠입니다</h2>
        <p>이 멘토의 모든 실무 노하우와 전체 게시글을 확인하려면 구독을 시작해보세요!</p>

        <div className={styles.modalPriceBox}>
          <span>구독 이용료</span>
          <strong>월 {currentPrice}원</strong>
        </div>

        <p className={styles.modalHint}>
          등록된 카드로 바로 결제됩니다. 카드가 없으면 이 자리에서 바로 등록하실 수 있어요.
        </p>

        <div className={styles.modalActionBtns}>
          <button className={styles.modalSubBtn} onClick={onSubscribe} disabled={!canSubscribe || subscribing}>
            {subscribing ? "결제 진행 중..." : `월 ${currentPrice}원으로 구독하기`}
          </button>
          <button className={styles.modalCloseBtn} onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
