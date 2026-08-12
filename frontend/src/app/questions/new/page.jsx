"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createQuestion } from "@/lib/questions";

import styles from "./form.module.css";
import { uploadImage } from "@/lib/attachments";

export default function NewQuestionPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("개발");
  const [content, setContent] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [images, setImages] = useState([]); // [{ attachId, url, name }]
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    //등록 버튼을 누르는 순간 로컬토큰(로그인 상태)이 있는지 한 번 더 확실하게 체크
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("로그인 후 이용 가능합니다.");
      router.push("/login");
      return;
    }

    setSubmitting(true);

    try {
      const uploaded = await Promise.all(files.map((f) => uploadImage(f)));
      const attachmentIds = uploaded.map((u) => u.attachId);
      const result = await createQuestion(
        title,
        content,
        category,
        attachmentIds,
      );
      const questionId =
        typeof result === "object" && result !== null ? result.id : result;
      router.push(`/questions/${questionId}`);
    } catch (error) {
      setSubmitting(false);

      // 2. 백엔드에서 인증 관련 에러(401 Unauthorized 또는 403 Forbidden)를 보낸 경우
      if (error.status === 401 || error.status === 403) {
        alert(
          "로그인 세션이 만료되었거나 권한이 없습니다. 다시 로그인해주세요.",
        );
        router.push("/login");
        return;
      }

      // 3. 그 외 일반적인 에러인 경우 화면에 예쁘게 표시
      setErrorMessage(error.message || "질문 등록 중 오류가 발생했습니다.");
    }
  };

const handleFileChange = (event) => {        // async 필요 없음
  const selected = Array.from(event.target.files || []);
  event.target.value = "";
  try {
    selected.forEach(validateImage);
    setFiles((prev) => [...prev, ...selected]);
  } catch (err) {
    setErrorMessage(err.message);
  }
};

  const removeImage = (attachId) =>
    setImages((prev) => prev.filter((img) => img.attachId !== attachId));

  return (
    <>
      <main className={styles.page}>
        <h1>새 질문 작성 / 수정하기</h1>

        <form onSubmit={handleSubmit} className={styles.panel}>
          <div className={styles.field}>
            <div className={styles.fieldHeader}>
              <label htmlFor="title">질문 제목</label>
              <span>{title.length}/100</span>
            </div>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              required
            />
          </div>

          <div className={styles.field}>
            <div className={styles.fieldHeader}>
              <label htmlFor="category">카테고리</label>
            </div>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #d1d5db",
                fontSize: "14px",
                fontFamily: "inherit",
              }}
            >
              <option value="개발">개발</option>
              <option value="멘토링">멘토링</option>
              <option value="취업">취업</option>
              <option value="기타">기타</option>
            </select>
          </div>

          <div className={styles.field}>
            <div className={styles.fieldHeader}>
              <label htmlFor="content">질문 내용</label>
              <span>{content.length}/5000</span>
            </div>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={5000}
              rows={8}
              required
            />
          </div>

          {/* 파일 업로드는 백엔드 미지원, UI만 있음 */}
          <div className={styles.field}>
            <label htmlFor="images">파일 첨부 (이미지, 최대 5MB)</label>
            <input
              id="images"
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              multiple
              onChange={handleFileChange}
              disabled={uploading || submitting}
            />
            {uploading && <p>업로드 중…</p>}

            {images.length > 0 && (
              <ul
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  listStyle: "none",
                  padding: 0,
                }}
              >
                {images.map((img) => (
                  <li key={img.attachId} style={{ position: "relative" }}>
                    <img
                      src={img.url}
                      alt={img.name}
                      width={96}
                      height={96}
                      style={{ objectFit: "cover", borderRadius: 6 }}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(img.attachId)}
                      aria-label="삭제"
                      style={{ position: "absolute", top: 2, right: 2 }}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {errorMessage && (
            <p className={styles.errorMessage}>{errorMessage}</p>
          )}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={() => router.back()}
            >
              취소
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={submitting}
            >
              {submitting ? "등록 중..." : "질문 등록 / 수정 완료"}
            </button>
          </div>
        </form>
      </main>
    </>
  );
}
