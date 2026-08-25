"use client";

import styles from "../page.module.css";

// 카드 미등록 상태에서 구독 시도 → 별도 페이지 이동 없이 이 자리에서 바로 카드 등록.
export default function CardRegistrationModal({ phoneNumber, onPhoneNumberChange, error, registering, onRegister, onClose }) {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <span className={styles.modalLockIcon}>💳</span>
        <h2>결제할 카드가 없어요</h2>
        <p>구독하려면 카드를 먼저 등록해야 해요. 지금 등록하면 바로 이어서 구독이 진행됩니다.</p>

        <div className={styles.cardPhoneField}>
          <label className={styles.cardPhoneLabel}>휴대폰 번호</label>
          <input
            type="text"
            value={phoneNumber}
            onChange={(e) => onPhoneNumberChange(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            maxLength={11}
            placeholder="01012345678"
            className={styles.cardPhoneInput}
          />
          <p className={styles.modalHint}>
            등록 버튼을 누르면 PortOne 결제창이 열리고, 거기서 카드 정보를 직접 입력합니다. 카드번호는 저희 서버에 저장되지 않습니다.
          </p>
        </div>

        {error && <p className={styles.cardError}>{error}</p>}

        <div className={`${styles.modalActionBtns} ${styles.modalActionBtnsSpaced}`}>
          <button className={styles.modalSubBtn} onClick={onRegister} disabled={registering}>
            {registering ? "카드 등록 중..." : "카드 등록하고 구독하기"}
          </button>
          <button className={styles.modalCloseBtn} onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
