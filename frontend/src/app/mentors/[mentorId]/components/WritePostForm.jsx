"use client";

import { useRef, useState } from "react";
import { useToast } from "@/app/contexts/ToastContext";
import { uploadImage, validateImage, uploadFile, validateFile } from "@/lib/attachments";
import { getAccessToken } from "@/lib/tokenStore";
import { API_URL as BACKEND_URL } from "@/lib/client";
import { buildAuthHeaders } from "../utils";
import styles from "../page.module.css";

// 부모가 isWritingPost일 때만 이 컴포넌트를 마운트한다 — 그래서 "작성 취소"를 누르면 그냥 언마운트되고,
// 다시 열 때 폼이 항상 빈 상태로 새로 시작한다(예전엔 토글 버튼이 postForm/files/docFiles를 수동으로 초기화했다).
export default function WritePostForm({ mentorId, currentUserId, onCreated }) {
  const { showToast } = useToast();
  const [postForm, setPostForm] = useState({ title: "", content: "", category: "일반", isPublic: true });
  const [files, setFiles] = useState([]);
  const [docFiles, setDocFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const contentRef = useRef(null);

  const insertCodeBlock = () => {
    const el = contentRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = postForm.content.slice(start, end);
    const snippet = "```java\n" + (selected || "여기에 코드") + "\n```\n";

    setPostForm((prev) => ({
      ...prev,
      content: prev.content.slice(0, start) + snippet + prev.content.slice(end),
    }));

    requestAnimationFrame(() => {
      el.focus();
      const pos = start + "```java\n".length;
      el.setSelectionRange(pos, pos + (selected ? selected.length : 6));
    });
  };

  const handlePostInputChange = (e) => {
    const { name, value } = e.target;
    setPostForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (event) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = "";
    try {
      selected.forEach(validateImage);
      setFiles((prev) => [...prev, ...selected]);
      setErrorMessage("");
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDocFileChange = (event) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = "";
    try {
      selected.forEach(validateFile);
      setDocFiles((prev) => [...prev, ...selected]);
      setErrorMessage("");
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  const removeDocFile = (index) => {
    setDocFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!postForm.title || !postForm.content) {
      showToast("제목과 내용을 모두 입력해주세요.", "error");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      const token = getAccessToken();
      const uploaded = files.length > 0 ? await Promise.all(files.map((f) => uploadImage(f))) : [];
      const uploadedDocs = docFiles.length > 0 ? await Promise.all(docFiles.map((f) => uploadFile(f))) : [];
      const attachmentIds = [...uploaded, ...uploadedDocs].map((u) => u.attachId);

      const res = await fetch(`${BACKEND_URL}/api/v1/mentors/${mentorId}/posts`, {
        method: "POST",
        headers: buildAuthHeaders({ token, userId: currentUserId, json: true }),
        body: JSON.stringify({ ...postForm, attachmentIds }),
      });

      if (res.ok) {
        showToast("게시글이 작성되었습니다.", "success");
        const newPostData = await res.json().catch(() => null);
        onCreated(newPostData);
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMessage(err.message || "요청 실패");
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("서버 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handlePostSubmit} className={styles.postForm}>
      <h3>새 게시글 작성</h3>
      <div className={styles.formGroup}>
        <label className={styles.fileLabel}>카테고리</label>
        <select name="category" value={postForm.category} onChange={handlePostInputChange} className={styles.formInput}>
          <option value="일반">일반</option>
          <option value="실무팁">실무팁</option>
          <option value="커리어">커리어</option>
          <option value="질문답변">질문답변</option>
        </select>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.fileLabel}>공개 범위</label>
        <div className={styles.visibilityRadioGroup}>
          <label className={styles.visibilityRadioLabel}>
            <input
              type="radio"
              name="isPublic"
              checked={postForm.isPublic === true}
              onChange={() => setPostForm((prev) => ({ ...prev, isPublic: true }))}
            />
            전체 공개 (비구독자 열람 가능)
          </label>
          <label className={styles.visibilityRadioLabel}>
            <input
              type="radio"
              name="isPublic"
              checked={postForm.isPublic === false}
              onChange={() => setPostForm((prev) => ({ ...prev, isPublic: false }))}
            />
            구독자 전용
          </label>
        </div>
      </div>

      <div className={styles.formGroup}>
        <input type="text" name="title" placeholder="제목을 입력하세요" value={postForm.title} onChange={handlePostInputChange} className={styles.formInput} required />
      </div>

      <div className={styles.formGroup}>
        <div className={styles.formLabelRow}>
          <label htmlFor="content">내용 (마크다운)</label>
          <button type="button" onClick={insertCodeBlock} className={styles.codeButton}>&lt;/&gt; 코드블록</button>
        </div>
        <textarea id="content" ref={contentRef} name="content" placeholder="내용을 입력하세요" value={postForm.content} onChange={handlePostInputChange} rows={6} className={styles.formTextarea} required />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.fileLabel}>파일 첨부 <span>이미지, 최대 5MB</span></label>
        <input id="images" type="file" accept="image/png,image/jpeg,image/gif,image/webp" multiple onChange={handleFileChange} disabled={submitting} />
        {files.length > 0 && (
          <ul className={styles.filePreviewList}>
            {files.map((file, index) => (
              <li key={index} className={styles.filePreview}>
                <img src={URL.createObjectURL(file)} alt={file.name} />
                <button type="button" onClick={() => removeFile(index)}>×</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.formGroup}>
        <label className={styles.fileLabel}>문서 첨부 <span>PDF, ZIP, 최대 50MB</span></label>
        <input id="docs" type="file" accept=".pdf,.zip,application/pdf,application/zip" multiple onChange={handleDocFileChange} disabled={submitting} />
        {docFiles.length > 0 && (
          <ul className={styles.docFileList}>
            {docFiles.map((file, index) => (
              <li key={index} className={styles.docFileItem}>
                <span>📎 {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)</span>
                <button type="button" onClick={() => removeDocFile(index)}>×</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {errorMessage && <p className={styles.formError}>{errorMessage}</p>}
      <button type="submit" className={styles.saveBtn} disabled={submitting}>{submitting ? "처리 중..." : "작성 완료"}</button>
    </form>
  );
}
