"use client";

import styles from "./TermsModal.module.css";

export default function FaqModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>자주 묻는 질문 (FAQ)</h2>
          <button onClick={onClose} className={styles.closeBtn}>✕</button>
        </div>
        <div className={styles.content}>
          <h3 style={{ marginTop: "4px" }}>Q1. 비로그인 상태에서도 질문을 볼 수 있나요?</h3>
          <p>A. 네! MentorBridge의 질문 피드는 로그인하지 않은 비회원 상태에서도 자유롭게 조회할 수 있습니다. 단, 질문 등록이나 멘토링 신청, 실시간 채팅 등 적극적인 참여를 위해서는 로그인이 필요합니다.</p>

          <h3 style={{ marginTop: "20px" }}>Q2. 멘토로 활동하려면 어떻게 해야 하나요?</h3>
          <p>A. 회원가입 후 프로필 설정에서 역할을 멘토 신청 메뉴를 통해 실무 경력 및 기술 스택을 인증하시면 관리자 승인 후 멘토로 활동하실 수 있습니다.</p>

          <h3 style={{ marginTop: "20px" }}>Q3. 질문은 어떻게 등록하나요?</h3>
          <p>A. 상단 또는 질문 피드 페이지 우측 상단의 <strong>'질문하기'</strong> 버튼을 클릭하여 작성하실 수 있습니다. 개발, 멘토링, 취업 등 카테고리를 선택하여 궁금한 점을 남겨보세요.</p>

          <h3 style={{ marginTop: "20px" }}>Q4. 1:1 채팅은 어떻게 이용하나요?</h3>
          <p>A. 로그인 후 상단 내비게이션 바의 <strong>'채팅'</strong> 메뉴를 통해 멘토 및 다른 회원들과 실시간으로 소통하실 수 있습니다.</p>

          <h3 style={{ marginTop: "20px" }}>Q5. 멘토의 구독자 전용 게시글은 어떻게 볼 수 있나요?</h3>
          <p>A. 구독자 전용 콘텐츠는 해당 멘토의 구독 플랜을 결제하여 구독 상태를 활성화하면 전체 게시글을 무제한으로 열람하실 수 있습니다.</p>

          <h3 style={{ marginTop: "20px" }}>Q6. 구독 해지 시 혜택은 언제까지 유지되나요?</h3>
          <p>A. 구독을 해지(해지 예약)하더라도 현재 이용 중인 구독 기간의 만료일까지는 정상적으로 구독 혜택이 유지됩니다.</p>

          <h3 style={{ marginTop: "20px" }}>Q7. 1:1 상담 신청은 어떻게 진행되나요?</h3>
          <p>A. 멘토 프로필 페이지의 '상담 신청' 버튼을 통해 이용하실 수 있으며, 멘토가 설정한 요일 및 시간대별 상담 가능 시간에 맞춰 실시간 채팅방으로 연결됩니다.</p>

          <h3 style={{ marginTop: "20px" }}>Q8. 멘토로 가입하여 프로필이나 요금제를 수정하려면 어떻게 하나요?</h3>
          <p>A. 본인이 소유한 멘토 프로필 페이지에서 직접 '프로필 수정' 버튼을 눌러 소개글, 경력, 상담 가능 시간 등을 변경할 수 있으며, 요금제 등록 및 수정은 내 프로필의 구독 플랜 관리에서 설정할 수 있습니다.</p>
        </div>
        <div className={styles.footer}>
          <button onClick={onClose} className={styles.confirmBtn}>확인</button>
        </div>
      </div>
    </div>
  );
}