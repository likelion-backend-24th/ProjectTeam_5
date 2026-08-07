"use client";

import { useState } from "react";
import styles from "./page.module.css";

export default function AnswerItem({
  answer,
  currentUser,
  onUpdate,
  onDelete,
  formatDate,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(answer.content);
  const [isSaving, setIsSaving] = useState(false);

  const isAnswerOwner =
    currentUser &&
    (currentUser.id === answer.authorId ||
      currentUser.id === answer.userId ||
      currentUser.name === answer.authorName);

  const isAdmin =
    currentUser?.role === "ADMIN" || currentUser?.role === "ROLE_ADMIN";

  const canManageAnswer = isAnswerOwner || isAdmin;

  const handleSave = async () => {
    if (!editContent.trim()) {
      alert("답변 내용을 입력해 주세요.");
      return;
    }

    try {
      setIsSaving(true);
      await onUpdate(answer.id, editContent);
      setIsEditing(false);
    } catch (error) {
      alert(error.message || "답변 수정 실패");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditContent(answer.content);
    setIsEditing(false);
  };

  return (
    <li className={styles.answerItem}>
      <div className={styles.answerHeader}>
        <span className={styles.mentorName}>
          {answer.authorName || answer.name || "익명"}
          {answer.mentorTitle && ` (${answer.mentorTitle})`}
        </span>

        <span className={styles.answerDate}>
          {formatDate(answer.createdAt)}
        </span>

        {!isEditing && (
          <span className={styles.ownerActions}>
            {isAnswerOwner && (
              <button type="button" onClick={() => setIsEditing(true)}>
                수정
              </button>
            )}
            {canManageAnswer && (
              <button type="button" onClick={() => onDelete(answer.id)}>
                삭제
              </button>
            )}
          </span>
        )}
      </div>

      {isEditing ? (
        <div className={styles.editForm}>
          <textarea
            className={styles.answerInput}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={3}
            disabled={isSaving}
          />
          <div className={styles.editActions}>
            <button type="button" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "저장 중..." : "저장"}
            </button>
            <button type="button" onClick={handleCancel} disabled={isSaving}>
              취소
            </button>
          </div>
        </div>
      ) : (
        <p className={styles.answerContent}>{answer.content}</p>
      )}
    </li>
  );
}