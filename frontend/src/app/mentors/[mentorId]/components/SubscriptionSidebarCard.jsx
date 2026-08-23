"use client";

import styles from "../page.module.css";

export default function SubscriptionSidebarCard({
  plans,
  selectedPlan,
  selectedPlanIndex,
  currentPrice,
  subscribing,
  onPrevPlan,
  onNextPlan,
  onSelectPlan,
  onOpenSubscribeModal,
}) {
  return (
    <div className={styles.sidebarCard}>
      <div className={styles.sidebarTitleRow}>
        <h3>구독 혜택</h3>
        {selectedPlan && <span className={styles.sidebarPrice}>월 {currentPrice}원</span>}
      </div>

      {plans.length === 0 ? (
        <p className={styles.noPlansText}>아직 등록된 요금제가 없습니다.</p>
      ) : (
        <>
          <div className={styles.planSwitcher}>
            <button type="button" className={styles.planArrow} onClick={onPrevPlan} disabled={plans.length <= 1} aria-label="이전 요금제">
              ‹
            </button>
            <div className={styles.planCard}>
              <strong className={styles.planName}>{selectedPlan.planName}</strong>
              <p className={styles.planDescription}>{selectedPlan.description || "설명이 등록되지 않았습니다."}</p>
              <span className={styles.planCycle}>{selectedPlan.billingCycle}개월마다 결제</span>
            </div>
            <button type="button" className={styles.planArrow} onClick={onNextPlan} disabled={plans.length <= 1} aria-label="다음 요금제">
              ›
            </button>
          </div>

          {plans.length > 1 && (
            <div className={styles.planDots}>
              {plans.map((p, i) => (
                <button
                  type="button"
                  key={p.id}
                  className={`${styles.planDot} ${i === selectedPlanIndex ? styles.planDotActive : ""}`}
                  onClick={() => onSelectPlan(i)}
                  aria-label={`${p.planName} 선택`}
                />
              ))}
            </div>
          )}
        </>
      )}

      <ul className={styles.benefitList}>
        <li><span>✓</span><div><strong>전체 피드 열람</strong><small>모든 게시글 무제한 열람</small></div></li>
        <li><span>✓</span><div><strong>구독자 전용 콘텐츠</strong><small>실무 노하우와 심층 인사이트</small></div></li>
        <li><span>✓</span><div><strong>자료 다운로드</strong><small>템플릿, 체크리스트, 가이드 제공</small></div></li>
        <li><span>✓</span><div><strong>댓글 참여 및 질문</strong><small>멘토에게 직접 질문하고 답변 받기</small></div></li>
      </ul>
      <button className={styles.sidebarSubscribeBtn} onClick={onOpenSubscribeModal} disabled={!selectedPlan || subscribing}>
        {subscribing ? "결제 진행 중..." : "구독하고 전체 보기"}
      </button>
    </div>
  );
}
