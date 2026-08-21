"use client";

import styles from "./TermsModal.module.css";

export default function TermsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>이용약관</h2>
          <button onClick={onClose} className={styles.closeBtn}>✕</button>
        </div>
        <div className={styles.content}>
          <h3 style={{ marginTop: "4px" }}>제 1 조 (목적)</h3>
          <p>본 약관은 <strong>MentorBridge</strong>(이하 &quot;회사&quot;)가 제공하는 커리어 브릿지 및 멘토링 플랫폼 서비스(이하 &quot;서비스&quot;)의 이용조건 및 절차, 회사와 회원 간의 권리, 의무 및 책임사항 등을 규정함을 목적으로 합니다.</p>

          <h3 style={{ marginTop: "20px" }}>제 2 조 (용어의 정의)</h3>
          <p>1. &quot;서비스&quot;란 구현되는 단말기(PC, 모바일 등)와 상관없이 회원이 이용할 수 있는 MentorBridge 및 관련 제반 서비스를 의미합니다.</p>
          <p>2. &quot;회원&quot;이란 회사의 서비스에 접속하여 본 약관에 동의하고, ID(이메일)를 발급받아 회사가 제공하는 서비스를 이용하는 자를 말합니다.</p>
          <p>3. &quot;멘토&quot;란 실무 지식과 취업 경험을 바탕으로 멘티에게 조언 및 멘토링 서비스를 제공하는 회원을 말합니다.</p>
          <p>4. &quot;멘티&quot;란 멘토로부터 커리어 상담, 질문 답변 등 멘토링 서비스를 제공받는 회원을 말합니다.</p>

          <h3 style={{ marginTop: "20px" }}>제 3 조 (약관의 효력과 개정)</h3>
          <p>1. 본 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.</p><p>2. 회사는 필요한 경우 관련 법령을 위배하지 않는 범위 내에서 본 약관을 개정할 수 있습니다.</p>

          <h3 style={{ marginTop: "20px" }}>제 4 조 (서비스의 제공 및 변경)</h3>
          <p>1. 회사는 다음과 같은 서비스를 제공합니다.</p>
          <p>&nbsp;&nbsp;- 취업 및 커리어 관련 질문/답변 피드 서비스</p>
          <p>&nbsp;&nbsp;- 현직 멘토 프로필 조회 및 멘토링 매칭 서비스</p>
          <p>&nbsp;&nbsp;- 회원 간 1:1 채팅 서비스</p>
          <p>2. 회사는 서비스의 고도화 및 운영상 필요에 따라 제공하는 서비스의 내용을 변경할 수 있습니다.</p>

          <h3 style={{ marginTop: "20px" }}>제 5 조 (회원의 의무)</h3>
          <p>1. 회원은 타인의 정보를 도용하거나 허위 내용을 등록해서는 안 됩니다.</p>
          <p>2. 회원은 타인을 모욕하거나 명예를 훼손하는 내용, 공서양속에 반하는 게시물을 등록하거나 전송할 수 없습니다.</p>
          <p>3. 회사는 회원이 본 조의 의무를 위반할 경우 서비스 이용을 제한하거나 회원 자격을 박탈할 수 있습니다.</p>
        </div>
        <div className={styles.footer}>
          <button onClick={onClose} className={styles.confirmBtn}>확인</button>
        </div>
      </div>
    </div>
  );
}