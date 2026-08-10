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
    return <p className={styles.statusText}>아직 등록된 답변이 없습니다.</p>;
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