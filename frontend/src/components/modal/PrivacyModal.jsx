"use client";

import styles from "./TermsModal.module.css";

export default function PrivacyModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>개인정보처리방침</h2>
          <button onClick={onClose} className={styles.closeBtn}>✕</button>
        </div>
        <div className={styles.content}>
          <p><strong>MentorBridge</strong>(이하 &quot;회사&quot;)는 통신비밀보호법, 전기통신사업법, 개인정보 보호법 등 정보통신서비스 제공자가 준수하여야 할 관련 법령상의 개인정보보호 규정을 준수하며, 이용자의 개인정보 보호에 최선을 다하고 있습니다.</p>

          <h3 style={{ marginTop: "20px" }}>1. 수집하는 개인정보의 항목 및 수집 방법</h3>
          <p><strong>가. 수집하는 개인정보의 항목</strong></p>
          <p>- 회원가입 및 관리: 필수항목 (이메일, 비밀번호, 이름, 닉네임, 역할), 선택항목 (프로필 이미지, 전화번호)</p>
          <p>- 멘토링 서비스 이용 시: 학력, 경력, 회사명, 주요 기술 태그, 자기소개 및 상담 가능 일정</p>
          <p>- 서비스 이용 과정에서 자동으로 생성되는 정보: IP 주소, 쿠키, 서비스 이용 기록, 접속 로그</p>
          <p><strong>나. 수집 방법</strong></p>
          <p>- 홈페이지 회원가입 및 프로필 수정, 멘토 신청, 1:1 채팅 및 고객 센터 문의</p>

          <h3 style={{ marginTop: "20px" }}>2. 개인정보의 수집 및 이용 목적</h3>
          <p>- <strong>회원 가입 및 관리</strong>: 회원제 서비스 제공, 본인 확인, 개인 식별, 부정이용 방지, 가입 의사 확인</p>
          <p>- <strong>멘토링 및 상담 서비스 제공</strong>: 멘토와 멘티 간의 1:1 매칭, 질문 피드 등록 및 답변 서비스, 실시간 채팅 기능 제공</p>
          <p>- <strong>고객 지원</strong>: 공지사항 전달, 민원 처리, 고충 처리</p>

          <h3 style={{ marginTop: "20px" }}>3. 개인정보의 보유 및 이용 기간</h3>
          <p>이용자의 개인정보는 원칙적으로 개인정보의 수집 및 이용 목적이 달성되면 지체 없이 파기합니다. 단, 관계 법령의 규정에 의하여 보존할 필요가 있는 경우 회사는 아래와 같이 관계 법령에서 정한 일정 기간 동안 회원 정보를 보관합니다.</p>
          <p>- 계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래 등에서의 소비자보호에 관한 법률)</p>
          <p>- 대금 결제 및 재화 등의 공급에 관한 기록: 5년</p>
          <p>- 소비자의 불만 또는 분쟁 처리에 관한 기록: 3년</p>

          <h3 style={{ marginTop: "20px" }}>4. 이용자의 권리와 그 행사 방법</h3>
          <p>이용자는 언제든지 등록되어 있는 자신의 개인정보를 조회하거나 수정할 수 있으며, 회원의 개인정보 수집 및 이용에 대한 동의를 철회할 수 있습니다.</p>
        </div>
        <div className={styles.footer}>
          <button onClick={onClose} className={styles.confirmBtn}>확인</button>
        </div>
      </div>
    </div>
  );
}