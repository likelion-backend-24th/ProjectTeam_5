"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

import { createQuestion } from "@/lib/questions";

import styles from "./form.module.css";
import { uploadImage, validateImage, uploadFile, validateFile } from "@/lib/attachments";

export default function NewQuestionPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("개발");
  const [content, setContent] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const contentRef = useRef(null);

  // 커서 위치에 마크다운 코드블록(```java ... ```)을 삽입
  const insertCodeBlock = () => {
    const el = contentRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = content.slice(start, end);
    const snippet = "```java\n" + (selected || "여기에 코드") + "\n```\n";
    setContent(content.slice(0, start) + snippet + content.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + "```java\n".length;
      el.setSelectionRange(pos, pos + (selected ? selected.length : 6));
    });
  };

  const [files, setFiles] = useState([]); // 선택한 원본 File[] (등록 시 업로드)
  const [docFiles, setDocFiles] = useState([]); // 이미지가 아닌 첨부파일(PDF/ZIP)

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
      const uploadedDocs = await Promise.all(docFiles.map((f) => uploadFile(f)));
      const attachmentIds = [...uploaded, ...uploadedDocs].map((u) => u.attachId);
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

  const handleFileChange = (event) => {
    // async 필요 없음
    const selected = Array.from(event.target.files || []);
    event.target.value = "";
    try {
      selected.forEach(validateImage);
      setFiles((prev) => [...prev, ...selected]);
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  const removeFile = (index) =>
    setFiles((prev) => prev.filter((_, i) => i !== index));

  const handleDocFileChange = (event) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = "";
    try {
      selected.forEach(validateFile);
      setDocFiles((prev) => [...prev, ...selected]);
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  const removeDocFile = (index) =>
    setDocFiles((prev) => prev.filter((_, i) => i !== index));

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
              <label htmlFor="content">질문 내용 (마크다운)</label>
              <span>
                <button
                  type="button"
                  onClick={insertCodeBlock}
                  style={{ marginRight: 8 }}
                >
                  &lt;/&gt; 코드블록
                </button>
                {content.length}/20000
              </span>
            </div>
            <textarea
              id="content"
              ref={contentRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={20000}
              rows={10}
              style={{ fontFamily: "monospace" }}
              required
            />
          </div>

          {/* 이미지는 선택만 해두고, 실제 업로드는 등록 시 handleSubmit에서 수행 */}
          <div className={styles.field}>
            <label htmlFor="images">파일 첨부 (이미지, 최대 5MB)</label>
            <input
              id="images"
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              multiple
              onChange={handleFileChange}
              disabled={submitting}
            />

            {files.length > 0 && (
              <ul
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  listStyle: "none",
                  padding: 0,
                }}
              >
                {files.map((file, index) => (
                  <li key={index} style={{ position: "relative" }}>
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      width={96}
                      height={96}
                      style={{ objectFit: "cover", borderRadius: 6 }}
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
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

          {/* 문서 첨부(이미지 아님) — PDF/ZIP, 최대 50MB */}
          <div className={styles.field}>
            <label htmlFor="docs">문서 첨부 (PDF, ZIP, 최대 50MB)</label>
            <input
              id="docs"
              type="file"
              accept=".pdf,.zip,application/pdf,application/zip"
              multiple
              onChange={handleDocFileChange}
              disabled={submitting}
            />

            {docFiles.length > 0 && (
              <ul style={{ listStyle: "none", padding: 0, marginTop: 8, display: "grid", gap: 6 }}>
                {docFiles.map((file, index) => (
                  <li
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      border: "1px solid #e5e7eb",
                      borderRadius: 6,
                      padding: "6px 10px",
                      fontSize: 13,
                    }}
                  >
                    <span>
                      📎 {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)
                    </span>
                    <button type="button" onClick={() => removeDocFile(index)} aria-label="삭제">
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
