"use client";

import AnswerItem from "./AnswerItem";
import styles from "./page.module.css";

export default function AnswerList({
                                     answers,
                                     currentUser,
                                     onCreateAnswer,
                                     onUpdate,
                                     onDelete,
                                     formatDate,
                                   }) {

  if (!answers || answers.length === 0) {
    return (
        <div className={styles.emptyState}>
          <div className={styles.emptyIconWrapper}>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                fill="none"
                viewBox="0 0 24 24"
                stroke="#9ca3af"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <circle cx="8" cy="10" r="1.5" fill="#9ca3af" stroke="none" />
              <circle cx="12" cy="10" r="1.5" fill="#9ca3af" stroke="none" />
              <circle cx="16" cy="10" r="1.5" fill="#9ca3af" stroke="none" />
            </svg>
          </div>
          <strong className={styles.emptyTitle}>아직 등록된 답변이 없습니다.</strong>
          <p className={styles.emptyDescription}>첫 번째 답변을 작성해 보세요!</p>
        </div>
    );
  }

  const topLevelAnswers = answers.filter((a) => !a.parentId);

  return (
      <ul className={styles.answerList}>
        {topLevelAnswers.map((answer) => (
            <AnswerItem
                key={answer.id}
                answer={answer}
                allAnswers={answers}
                currentUser={currentUser}
                onCreateAnswer={onCreateAnswer}
                onUpdate={onUpdate}
                onDelete={onDelete}
                formatDate={formatDate}
                topParentId={answer.id}
            />
        ))}
      </ul>
  );
}