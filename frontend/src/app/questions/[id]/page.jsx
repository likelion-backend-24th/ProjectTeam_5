"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { FaHeart, FaRegHeart } from "react-icons/fa";

import {
  getQuestion,
  getAnswers,
  deleteQuestion,
  createAnswer,
  updateAnswer,
  deleteAnswer,
  toggleLike,
} from "@/lib/questions";
import { getMe } from "@/lib/auth";
// 👇 팔로우 관련 함수 임포트 추가
import { getPublicProfile, toggleFollowUser, getToken } from "@/lib/users";

import AnswerForm from "../answers/AnswerForm";
import AnswerList from "../answers/AnserList";
import Markdown from "@/components/Markdown/Markdown";
import { downloadFile } from "@/lib/attachments";
import ConfirmDialog from "@/components/modal/ConfirmDialog";
import { useToast } from "@/app/contexts/ToastContext";
import styles from "./page.module.css";

export default function QuestionDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { showToast } = useToast();

  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);

  // confirm() 게이트(질문 삭제, 답변 삭제)를 대체하는 범용 확인 상태
  const [pendingAction, setPendingAction] = useState(null);
  const [actionSubmitting, setActionSubmitting] = useState(false);

  const runPendingAction = async (inputValue) => {
    if (!pendingAction) return;
    setActionSubmitting(true);
    try {
      await pendingAction.run(inputValue);
      setPendingAction(null);
    } catch (error) {
      showToast(error.message || "처리에 실패했습니다.", "error");
    } finally {
      setActionSubmitting(false);
    }
  };

  // 👇 팔로우 로딩 상태 추가
  const [isFollowing, setIsFollowing] = useState(false);

  const fetchAnswers = useCallback(async () => {
    try {
      const answersResult = await getAnswers(id);
      setAnswers(answersResult.content ?? answersResult ?? []);
    } catch (error) {
      console.error("답변 목록 조회 실패:", error);
    }
  }, [id]);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      setLoading(true);
      setErrorMessage("");

      const token = getToken();

      try {
        const [questionResult, answersResult, userResult] = await Promise.all([
          getQuestion(id),
          getAnswers(id),
          token ? getMe(token).catch(() => null) : Promise.resolve(null),
        ]);

        if (!ignore) {
          setQuestion(questionResult);
          setAnswers(answersResult.content ?? answersResult ?? []);
          setCurrentUser(userResult);

          // 💡 질문 작성자의 정보를 조회하여 내가 팔로우 중인지 확인
          if (questionResult?.userId || questionResult?.authorId) {
            const targetUserId = questionResult.userId || questionResult.authorId;
            try {
              // getPublicProfile 내부에서 자동으로 getToken()을 통해 내 토큰을 보냄
              const prof = await getPublicProfile(targetUserId);
              if (prof) setIsFollowing(prof.isFollowing);
            } catch (e) {
              console.error("프로필 조회 실패:", e);
            }
          }
        }
      } catch (error) {
        console.error("데이터 조회 실패:", error);

        if (!ignore) {
          if (error.status === 404) {
            setErrorMessage("삭제되었거나 존재하지 않는 질문입니다.");
          } else {
            setErrorMessage(error.message || "질문을 불러오지 못했습니다.");
          }
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    if (id) {
      loadData();
    }

    return () => {
      ignore = true;
    };
  }, [id]);

  const handleDeleteQuestion = () => {
    setPendingAction({
      title: "질문 삭제",
      message: "질문을 삭제할까요?",
      confirmLabel: "삭제",
      danger: true,
      run: async () => {
        await deleteQuestion(id);
        router.push("/questions");
      },
    });
  };

  // 좋아요 토글 핸들러
  const handleToggleLike = async () => {
    if (!currentUser) {
      showToast("로그인 후 이용 가능합니다.", "error");
      router.push("/login");
      return;
    }

    if (isLikeLoading) return;

    const prevIsLiked = question.isLiked;
    const prevLikeCount = question.likeCount;

    const nextIsLiked = !prevIsLiked;
    const nextLikeCount = nextIsLiked
        ? prevLikeCount + 1
        : Math.max(0, prevLikeCount - 1);

    setQuestion((prev) => ({
      ...prev,
      isLiked: nextIsLiked,
      likeCount: nextLikeCount,
    }));

    try {
      setIsLikeLoading(true);
      const res = await toggleLike(id);

      setQuestion((prev) => ({
        ...prev,
        isLiked: res.isLiked ?? nextIsLiked,
        likeCount: res.likeCount ?? nextLikeCount,
      }));
    } catch (error) {
      setQuestion((prev) => ({
        ...prev,
        isLiked: prevIsLiked,
        likeCount: prevLikeCount,
      }));
      showToast(error.message || "좋아요 처리에 실패했습니다.", "error");
    } finally {
      setIsLikeLoading(false);
    }
  };

  // 👇 팔로우 토글 핸들러
  const handleFollow = async () => {
    const token = getToken();
    if (!token) {
      showToast("로그인이 필요합니다.", "error");
      router.push("/login");
      return;
    }

    try {
      const targetUserId = question.userId || question.authorId;
      await toggleFollowUser(targetUserId, token);
      setIsFollowing(!isFollowing);
    } catch (e) {
      showToast(e.message || "팔로우 처리에 실패했습니다.", "error");
    }
  };

  const handleCreateAnswer = async (content, parentId = null, resetForm) => {
    let parent = parentId;
    let reset = resetForm;
    if (typeof parentId === "function") {
      reset = parentId;
      parent = null;
    }

    try {
      setIsSubmitting(true);
      await createAnswer(id, { content, parentId: parent });
      if (reset) reset();
      await fetchAnswers();
    } catch (error) {
      showToast(error.message || "답변 등록에 실패했습니다.", "error");
      if (error.status === 401 || error.status === 403) {
        router.push("/login");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async (file) => {
    try {
      await downloadFile(file.attachId, file.originalFileName);
    } catch (error) {
      showToast(error.message || "파일 다운로드에 실패했습니다.", "error");
      if (error.status === 401 || error.status === 403) {
        router.push("/login");
      }
    }
  };

  const handleUpdateAnswer = async (answerId, content) => {
    try {
      await updateAnswer(answerId, { content });
      await fetchAnswers();
    } catch (error) {
      showToast(error.message || "답변 수정에 실패했습니다.", "error");
      if (error.status === 401 || error.status === 403) {
        router.push("/login");
      }
      throw error;
    }
  };

  const handleDeleteAnswer = (answerId) => {
    setPendingAction({
      title: "답변 삭제",
      message: "정말 이 답변을 삭제하시겠습니까?",
      confirmLabel: "삭제",
      danger: true,
      run: async () => {
        try {
          await deleteAnswer(answerId);
          await fetchAnswers();
        } catch (error) {
          if (error.status === 401 || error.status === 403) {
            router.push("/login");
          }
          throw error;
        }
      },
    });
  };

  const isQuestionOwner =
      currentUser &&
      question &&
      (currentUser.id === question.authorId ||
          currentUser.id === question.userId ||
          currentUser.id === question.author?.id ||
          currentUser.name === question.authorName);

  const isAdmin =
      currentUser?.role === "ADMIN" || currentUser?.role === "ROLE_ADMIN";

  const canManageQuestion = isQuestionOwner || isAdmin;

  return (
      <main className={styles.page}>
        <Link href="/questions" className={styles.backLink}>
          ← 목록으로
        </Link>

        {loading && <p className={styles.statusText}>불러오는 중...</p>}

        {!loading && errorMessage && (
            <p className={styles.errorMessage}>{errorMessage}</p>
        )}

        {!loading && !errorMessage && question && (
            <>
              <section className={styles.panel}>
                <div className={styles.profileSection}>
                  <img
                      src={question.authorProfileImageUrl || `https://ui-avatars.com/api/?name=${question.authorName || question.name || "익명"}&background=f3f4f6&color=6b7280`}
                      alt="프로필"
                      className={styles.profileImage}
                  />

                  <div className={styles.profileInfo}>

                    <Link
                        href={`/users/${question.userId || question.authorId}?name=${encodeURIComponent(question.authorName || question.name || "익명")}`}
                        className={styles.authorName}
                    >
                      {question.authorName || question.name || "익명"}
                    </Link>
                    <span className={styles.separator}>·</span>
                    <span className={styles.postDate}>
                  {formatDate(question.createdAt)}
                </span>

                    {/* 👇 본인 글이 아닐 때만 팔로우 버튼 표시 👇 */}
                    {!isQuestionOwner && (question.userId || question.authorId) && (
                        <button
                            className={isFollowing ? styles.followingBadgeBtn : styles.followBadgeBtn}
                            onClick={handleFollow}
                        >
                          {isFollowing ? "✓ 팔로잉" : "+ 팔로우"}
                        </button>
                    )}
                  </div>

                  {/* 수정/삭제 버튼 컨테이너 */}
                  <div className={styles.ownerActions}>
                    {isQuestionOwner && (
                        <Link href={`/questions/${id}/edit`}>수정</Link>
                    )}
                    {canManageQuestion && (
                        <button type="button" onClick={handleDeleteQuestion}>
                          삭제
                        </button>
                    )}
                  </div>
                </div>

                <h1>{question.title}</h1>
                <div className={styles.content}>
                  <Markdown source={question.content} />
                </div>

                {question.images?.length > 0 && (
                    <div className={styles.attachments}>
                      {question.images.map((img) => (
                          <img
                              key={img.attachId}
                              src={img.url}
                              alt="첨부 이미지"
                              style={{
                                maxWidth: "100%",
                                borderRadius: 8,
                                marginTop: 12,
                                display: "block",
                              }}
                          />
                      ))}
                    </div>
                )}

                {question.files?.length > 0 && (
                    <ul style={{ listStyle: "none", padding: 0, marginTop: 12, display: "grid", gap: 6 }}>
                      {question.files.map((file) => (
                          <li key={file.attachId}>
                            <button
                                type="button"
                                onClick={() => handleDownload(file)}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6,
                                  padding: "8px 12px",
                                  border: "1px solid #e5e7eb",
                                  borderRadius: 8,
                                  fontSize: 14,
                                  background: "none",
                                  cursor: "pointer",
                                  color: "#374151",
                                }}
                            >
                              📎 {file.originalFileName} ({(file.size / 1024 / 1024).toFixed(2)}MB)
                            </button>
                          </li>
                      ))}
                    </ul>
                )}

                {/* 좋아요 버튼 섹션 */}
                <div className={styles.likeSection}>
                  <button
                      type="button"
                      className={styles.likeButton}
                      onClick={handleToggleLike}
                      disabled={isLikeLoading}
                  >
                    <div
                        className={`${styles.likeIcon} ${
                            question.isLiked ? styles.likeIconActive : ""
                        }`}
                    >
                      {question.isLiked ? <FaHeart /> : <FaRegHeart />}
                    </div>
                    <span className={styles.likeCount}>
                  좋아요 {question.likeCount ?? 0}
                </span>
                  </button>
                </div>
              </section>

              <section className={styles.answers}>
                <h2>답변 목록 ({answers.length})</h2>

                <AnswerForm
                    onSubmit={handleCreateAnswer}
                    isSubmitting={isSubmitting}
                    currentUser={currentUser}
                />

                <AnswerList
                    answers={answers}
                    currentUser={currentUser}
                    onUpdate={handleUpdateAnswer}
                    onDelete={handleDeleteAnswer}
                    formatDate={formatDate}
                    onCreateAnswer={handleCreateAnswer}
                />
              </section>
            </>
        )}

        <ConfirmDialog
          isOpen={!!pendingAction}
          title={pendingAction?.title}
          message={pendingAction?.message}
          confirmLabel={pendingAction?.confirmLabel || "확인"}
          danger={pendingAction?.danger}
          submitting={actionSubmitting}
          onConfirm={runPendingAction}
          onCancel={() => setPendingAction(null)}
        />
      </main>
  );
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}