"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./Footer.module.css";
import TermsModal from "../modal/TermsModal";
import PrivacyModal from "../modal/PrivacyModal";
import FaqModal from "../modal/FaqModal";
import InquiryModal from "../modal/InquiryModal"; // 👈 modal 폴더 참조 경로 (../modal)

export default function Footer() {
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);

  return (
    <>
      <footer className={styles.footer}>
        <div className={styles.inner}>
          <div className={styles.info}>
            <div className={styles.brand}>
              <span className={styles.logo}>M</span>
              <span>MentorBridge</span>
            </div>
            <p className={styles.description}>
              취업 준비생들과 현직 멘토를 연결하는 실무 중심 커리어 브릿지 플랫폼
            </p>
            <p className={styles.copyright}>
              © 2026 MentorBridge. All rights reserved.
            </p>
          </div>
          <div className={styles.links}>
            <div className={styles.linkGroup}>
              <h4>서비스</h4>
              <Link href="/questions">질문 피드</Link>
              <Link href="/mentors">멘토 피드</Link>
            </div>
            <div className={styles.linkGroup}>
              <h4>고객지원</h4>
              {/* 1:1 문의/신고 모달 열기 */}
              <Link 
                href="#" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  setIsInquiryOpen(true); 
                }}
              >
                1:1 문의/신고
              </Link>

              {/* 자주 묻는 질문 모달 열기 */}
              <Link 
                href="#" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  setIsFaqOpen(true); 
                }}
              >
                자주 묻는 질문
              </Link>

              {/* 이용약관 모달 열기 */}
              <Link 
                href="#" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  setIsTermsOpen(true); 
                }}
              >
                이용약관
              </Link>

              {/* 개인정보처리방침 모달 열기 */}
              <Link 
                href="#" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  setIsPrivacyOpen(true); 
                }}
              >
                개인정보처리방침
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* 모달 컴포넌트들 */}
      <InquiryModal isOpen={isInquiryOpen} onClose={() => setIsInquiryOpen(false)} />
      <FaqModal isOpen={isFaqOpen} onClose={() => setIsFaqOpen(false)} />
      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
      <PrivacyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
    </>
  );
}