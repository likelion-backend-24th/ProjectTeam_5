"use client";

import { useState } from "react";
import AnswerForm from "./AnswerForm";
import Markdown from "@/components/Markdown/Markdown";
import { useToast } from "@/app/contexts/ToastContext";
import styles from "./page.module.css";

const getAnswerId = (obj) => obj?.answer_id ?? obj?.answerId ?? obj?.id;
const getParentId = (obj) => obj?.parent_id ?? obj?.parentId ?? obj?.parentAnswerId;

export default function AnswerItem({
  answer,
  allAnswers = [],
  currentUser,
  onCreateAnswer,
  onUpdate,
  onDelete,
  formatDate,
  topParentId,
  depth = 0,
  parentAuthorName = null,
}) {
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(answer.content);
  const [isSaving, setIsSaving] = useState(false);

  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isReplySubmitting, setIsReplySubmitting] = useState(false);

  const currentAnswerId = getAnswerId(answer);
  const currentParentId = getParentId(answer);

  const authorName = answer.authorName || answer.name || "익명";

  const isAnswerOwner =
    currentUser &&
    (currentUser.id === answer.authorId ||
      currentUser.id === answer.userId ||
      currentUser.name === authorName);

  const isAdmin =
    currentUser?.role === "ADMIN" || currentUser?.role === "ROLE_ADMIN";

  const canManageAnswer = isAnswerOwner || isAdmin;

  const childReplies = allAnswers.filter(
    (item) => getParentId(item) === currentAnswerId
  );

  const currentTopParentId = topParentId || currentAnswerId;

  const handleSave = async () => {
    if (!editContent.trim()) {
      showToast("답변 내용을 입력해 주세요.", "error");
      return;
    }

    try {
      setIsSaving(true);
      await onUpdate(currentAnswerId, editContent);
      setIsEditing(false);
    } catch (error) {
      showToast(error.message || "답변 수정 실패", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditContent(answer.content);
    setIsEditing(false);
  };

  const handleReplySubmit = async (content, resetForm) => {
    try {
      setIsReplySubmitting(true);
      await onCreateAnswer(content, currentAnswerId, resetForm);
      setShowReplyForm(false);
    } finally {
      setIsReplySubmitting(false);
    }
  };

  return (
    <li className={depth > 0 ? styles.replyItem : styles.answerItem}>
      <div className={styles.answerHeader}>
        <span className={styles.mentorName}>
          {authorName}
          {answer.mentorTitle && ` (${answer.mentorTitle})`}
        </span>

        <span className={styles.answerDate}>
          {formatDate(answer.createdAt)}
        </span>

        {!isEditing && (
          <span className={styles.ownerActions}>
            <button
              type="button"
              onClick={() => setShowReplyForm((prev) => !prev)}
            >
              {showReplyForm ? "답글 취소" : "답글 달기"}
            </button>
            {isAnswerOwner && (
              <button type="button" onClick={() => setIsEditing(true)}>
                수정
              </button>
            )}
            {canManageAnswer && (
              <button type="button" onClick={() => onDelete(currentAnswerId)}>
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
        <div className={styles.answerContent}>
          {depth >= 1 && parentAuthorName && (
            <span className={styles.mentionTag}>@{parentAuthorName} </span>
          )}
          <Markdown source={answer.content} />
        </div>
      )}

      {showReplyForm && (
        <div className={styles.replyFormContainer}>
          <AnswerForm
            onSubmit={handleReplySubmit}
            isSubmitting={isReplySubmitting}
            currentUser={currentUser}
            placeholder={`@${authorName} 님에게 답글 작성...`}
          />
        </div>
      )}

      {childReplies.length > 0 && (
        <ul className={styles.replyList}>
          {childReplies.map((reply) => (
            <AnswerItem
              key={getAnswerId(reply)}
              answer={reply}
              allAnswers={allAnswers}
              currentUser={currentUser}
              onCreateAnswer={onCreateAnswer}
              onUpdate={onUpdate}
              onDelete={onDelete}
              formatDate={formatDate}
              topParentId={currentTopParentId}
              depth={depth + 1}
              parentAuthorName={authorName}
            />
          ))}
        </ul>
      )}
    </li>
  );
}