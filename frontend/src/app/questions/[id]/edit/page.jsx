"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

import { getQuestion, updateQuestion } from "@/lib/questions";
import { uploadImage, validateImage, uploadFile, validateFile } from "@/lib/attachments";

import styles from "../../new/form.module.css";

const docRowStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  border: "1px solid #e5e7eb",
  borderRadius: 6,
  padding: "6px 10px",
  fontSize: 13,
};

export default function EditQuestionPage() {
  const { id } = useParams();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("개발");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [existingImages, setExistingImages] = useState([]); // [{ attachId, url }] 유지 대상
  const [newFiles, setNewFiles] = useState([]); // 새로 올릴 File[]

  const [existingDocs, setExistingDocs] = useState([]); // [{ attachId, originalFileName, size, downloadUrl }] 유지 대상
  const [newDocFiles, setNewDocFiles] = useState([]); // 새로 올릴 문서 File[]

  const contentRef = useRef(null);

  // 커서 위치에 마크다운 코드블록(```java ... ```)을 삽입
  const insertCodeBlock = () => {
    const el = contentRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = content.slice(start, end);
    // 코드펜스(```)는 줄 맨 앞에서 시작해야 마크다운으로 인식된다 — 커서 앞이 줄 시작이 아니면 개행을 먼저 넣는다.
    const needsLeadingNewline = start > 0 && content[start - 1] !== "\n";
    const prefix = needsLeadingNewline ? "\n" : "";
    const snippet = prefix + "```java\n" + (selected || "여기에 코드") + "\n```\n";
    setContent(content.slice(0, start) + snippet + content.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + prefix.length + "```java\n".length;
      el.setSelectionRange(pos, pos + (selected ? selected.length : 6));
    });
  };

  useEffect(() => {
    let ignore = false;

    // getQuestion 로드 시 기존 이미지도 세팅
    getQuestion(id)
      .then((question) => {
        setTitle(question.title || "");
        setCategory(question.category || "개발");
        setContent(question.content || "");
        setExistingImages(question.images || []); // ★ STEP 1에서 바뀐 형태
        setExistingDocs(question.files || []);
      })
      .catch((error) => {
        if (!ignore) setErrorMessage(error.message);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [id]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    // 1. 등록/수정 버튼을 누르는 순간 로컬토큰(로그인 상태) 체크
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("로그인 후 이용 가능합니다.");
      router.push("/login");
      return;
    }

    setSubmitting(true);

    try {
      // 1) 새로 추가한 파일만 지금 업로드 → 새 attachId
      const uploaded = await Promise.all(newFiles.map((f) => uploadImage(f)));
      const newIds = uploaded.map((u) => u.attachId);

      const uploadedDocs = await Promise.all(newDocFiles.map((f) => uploadFile(f)));
      const newDocIds = uploadedDocs.map((u) => u.attachId);

      // 2) 유지할 기존 id + 새 id = 최종 목록
      const attachmentIds = [
        ...existingImages.map((img) => img.attachId),
        ...newIds,
        ...existingDocs.map((doc) => doc.attachId),
        ...newDocIds,
      ];

      // 3) 수정 요청
      await updateQuestion(id, title, content, category, attachmentIds);
      router.push(`/questions/${id}`);
    } catch (error) {
      setSubmitting(false);

      // 2. 백엔드에서 인증 관련 에러(401 또는 403)를 보낸 경우
      if (error.status === 401 || error.status === 403) {
        alert(
          "로그인 세션이 만료되었거나 권한이 없습니다. 다시 로그인해주세요.",
        );
        router.push("/login");
        return;
      }

      // 3. 기타 에러
      setErrorMessage(error.message || "질문 수정 중 오류가 발생했습니다.");
    }
  };

  // 기존 이미지 제거(화면에서만 빼고, 저장 시 최종 목록에서 빠지면 백엔드가 삭제)
  const removeExisting = (attachId) =>
    setExistingImages((prev) => prev.filter((img) => img.attachId !== attachId));

  // 새 파일 선택(검증만, 업로드는 저장 시)
  const handleFileChange = (event) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = "";
    try {
      selected.forEach(validateImage);
      setNewFiles((prev) => [...prev, ...selected]);
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  const removeNewFile = (index) =>
    setNewFiles((prev) => prev.filter((_, i) => i !== index));

  const removeExistingDoc = (attachId) =>
    setExistingDocs((prev) => prev.filter((doc) => doc.attachId !== attachId));

  const handleDocFileChange = (event) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = "";
    try {
      selected.forEach(validateFile);
      setNewDocFiles((prev) => [...prev, ...selected]);
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  const removeNewDocFile = (index) =>
    setNewDocFiles((prev) => prev.filter((_, i) => i !== index));

  if (loading) {
    return (
      <main className={styles.page}>
        <p>불러오는 중...</p>
      </main>
    );
  }

  return (
    <>
      <main className={styles.page}>
        <h1>질문 수정하기</h1>

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

            {/* 기존 이미지 (서버 URL) */}
            {existingImages.length > 0 && (
              <ul
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  listStyle: "none",
                  padding: 0,
                }}
              >
                {existingImages.map((img) => (
                  <li key={img.attachId} style={{ position: "relative" }}>
                    <img
                      src={img.url}
                      alt=""
                      width={96}
                      height={96}
                      style={{ objectFit: "cover", borderRadius: 6 }}
                    />
                    <button
                      type="button"
                      onClick={() => removeExisting(img.attachId)}
                      aria-label="삭제"
                      style={{ position: "absolute", top: 2, right: 2 }}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* 새로 추가한 파일 (로컬 미리보기) */}
            {newFiles.length > 0 && (
              <ul
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  listStyle: "none",
                  padding: 0,
                }}
              >
                {newFiles.map((file, index) => (
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
                      onClick={() => removeNewFile(index)}
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

            {(existingDocs.length > 0 || newDocFiles.length > 0) && (
              <ul style={{ listStyle: "none", padding: 0, marginTop: 8, display: "grid", gap: 6 }}>
                {existingDocs.map((doc) => (
                  <li key={doc.attachId} style={docRowStyle}>
                    <span>
                      📎 {doc.originalFileName} ({(doc.size / 1024 / 1024).toFixed(2)}MB)
                    </span>
                    <button type="button" onClick={() => removeExistingDoc(doc.attachId)} aria-label="삭제">
                      ×
                    </button>
                  </li>
                ))}
                {newDocFiles.map((file, index) => (
                  <li key={`new-${index}`} style={docRowStyle}>
                    <span>
                      📎 {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)
                    </span>
                    <button type="button" onClick={() => removeNewDocFile(index)} aria-label="삭제">
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
              {submitting ? "저장 중..." : "질문 수정 완료"}
            </button>
          </div>
        </form>
      </main>
    </>
  );
}
