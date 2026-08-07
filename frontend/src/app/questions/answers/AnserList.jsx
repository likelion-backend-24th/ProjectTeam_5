"use client";

import AnswerItem from "./AnswerItem";
import styles from "./page.module.css";

export default function AnswerList({
  answers,
  currentUser,
  onUpdate,
  onDelete,
  formatDate,
}) {
  if (answers.length === 0) {
    return <p className={styles.statusText}>아직 등록된 답변이 없습니다.</p>;
  }
  return (
    <ul className={styles.answerList}>
      {answers.map((answer) => (
        <AnswerItem
          key={answer.id}
          answer={answer}
          currentUser={currentUser}
          onUpdate={onUpdate}
          onDelete={onDelete}
          formatDate={formatDate}
        />
      ))}
    </ul>
  );
}